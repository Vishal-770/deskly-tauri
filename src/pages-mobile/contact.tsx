import { Navigate } from "react-router-dom";

export default function ContactRedirect() {
  return <Navigate to="/dashboard/contact" replace />;
}
