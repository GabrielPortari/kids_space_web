type StatusMessageProps = {
  message: string | null;
};

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#d4edda",
        color: "#155724",
        padding: "1rem",
        marginBottom: "1rem",
        borderRadius: "0.25rem",
        border: "1px solid #c3e6cb",
      }}
    >
      {message}
    </div>
  );
}
