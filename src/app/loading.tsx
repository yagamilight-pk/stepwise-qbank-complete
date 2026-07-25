export default function Loading() {
  return (
    <main className="recovery-page" aria-busy="true" aria-live="polite">
      <section>
        <div className="recovery-card" role="status">
          <span className="spinner" aria-hidden="true" />
          <h1>Preparing Stepwise</h1>
          <p>Loading your workspace…</p>
        </div>
      </section>
    </main>
  );
}
