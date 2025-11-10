const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export async function apiRequest(path, method = "GET", body = null, token = "") {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers["x-auth-token"] = token;

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
