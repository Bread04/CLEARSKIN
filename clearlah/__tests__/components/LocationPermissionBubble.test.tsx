import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationPermissionBubble from "@/components/ui/LocationPermissionBubble";

describe("LocationPermissionBubble", () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });
  });

  it("renders Allow and Skip buttons", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);

    expect(screen.getByRole("button", { name: /allow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
  });

  it("renders the location request message", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);

    expect(screen.getByText(/weather/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
  });

  it("Allow button requests geolocation and stores coords in sessionStorage", async () => {
    const mockCoords = { latitude: 1.3521, longitude: 103.8198 };
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success: PositionCallback) => {
      success({ coords: mockCoords, timestamp: Date.now() } as GeolocationPosition);
    });

    const onDismiss = vi.fn();
    render(<LocationPermissionBubble onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /allow/i }));

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledOnce();

    await vi.waitFor(() => {
      const stored = sessionStorage.getItem("clearlah_location");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.latitude).toBe(1.3521);
      expect(parsed.longitude).toBe(103.8198);
    });

    await vi.waitFor(() => {
      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });

  it("sets localStorage flag after Allow", async () => {
    const mockCoords = { latitude: 1.3521, longitude: 103.8198 };
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success: PositionCallback) => {
      success({ coords: mockCoords, timestamp: Date.now() } as GeolocationPosition);
    });

    render(<LocationPermissionBubble onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /allow/i }));

    await vi.waitFor(() => {
      expect(localStorage.getItem("clearlah_location_permission_asked")).toBe("true");
    });
  });

  it("Skip button dismisses without storing coordinates", () => {
    const onDismiss = vi.fn();
    render(<LocationPermissionBubble onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /skip/i }));

    expect(sessionStorage.getItem("clearlah_location")).toBeNull();
    expect(localStorage.getItem("clearlah_location_permission_asked")).toBe("true");
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("handles geolocation denial gracefully", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "User denied" } as GeolocationPositionError);
      }
    );

    const onDismiss = vi.fn();
    render(<LocationPermissionBubble onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /allow/i }));

    await vi.waitFor(() => {
      expect(sessionStorage.getItem("clearlah_location")).toBeNull();
      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });

  it("buttons have proper aria-labels", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Allow location access" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip location" })).toBeInTheDocument();
  });

  it("buttons have minimum 44x44px touch targets", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);

    const allowBtn = screen.getByRole("button", { name: /allow/i });
    const skipBtn = screen.getByRole("button", { name: /skip/i });

    expect(allowBtn.className).toMatch(/min-h-\[44px\]/);
    expect(allowBtn.className).toMatch(/min-w-\[44px\]/);
    expect(skipBtn.className).toMatch(/min-h-\[44px\]/);
    expect(skipBtn.className).toMatch(/min-w-\[44px\]/);
  });

  it("has role=status for screen readers", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("animate in class present when visible", () => {
    render(<LocationPermissionBubble onDismiss={vi.fn()} />);

    const container = screen.getByRole("status");
    expect(container.className).toMatch(/motion-safe/);
  });
});
