export const Stat = ({
  label,
  value,
  danger,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) => (
  <div className="text-center">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p
      className={`text-3xl font-semibold mt-1 ${
        danger ? "text-red-500" : "text-primary"
      }`}
    >
      {value}
    </p>
  </div>
);
