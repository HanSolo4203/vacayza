export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cursor-auto [&_*]:cursor-auto [&_a]:cursor-pointer [&_button]:cursor-pointer [&_input]:cursor-text [&_select]:cursor-pointer [&_textarea]:cursor-text">
      {children}
    </div>
  );
}
