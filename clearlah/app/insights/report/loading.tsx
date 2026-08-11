export default function ReportLoading() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="skeleton h-10 w-32" />
        <div className="skeleton h-5 w-96" />
        <div className="skeleton h-48 rounded-md" />
        <div className="skeleton h-48 rounded-md" />
        <div className="skeleton h-64 rounded-md" />
      </div>
    </main>
  );
}
