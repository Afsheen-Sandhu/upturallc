"use client";

export default function AdminTableSkeleton({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="admin-content">
      <div className="admin-placeholder">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

