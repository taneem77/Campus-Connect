import React, { useState } from "react";
import { Mail, Phone, Save, Lock, Upload, Sun, Moon, User, File } from "lucide-react";
import { apiRequest } from "../utils/api"; 

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ProfilePage({ user, token, onUserUpdate, theme, toggleTheme }) {
  const [name, setName] = useState(user.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file selected"); // <-- NEW state
  const [uploading, setUploading] = useState(false);

  // ... (handleNameUpdate is the same)
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await apiRequest("/api/profile/name", "PUT", { name }, token);
      onUserUpdate(data.user); 
      setMessage(data.message);
    } catch (err) {
      setMessage(err.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  // ... (handlePasswordUpdate is the same)
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await apiRequest(
        "/api/profile/password",
        "PUT",
        { oldPassword, newPassword },
        token
      );
      setMessage(data.message);
      setOldPassword(""); 
      setNewPassword("");
    } catch (err) {
      setMessage(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // --- [UPDATED] Handle File Selection ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name); // <-- Set the filename
    } else {
      setFile(null);
      setFileName("No file selected");
    }
  };

  // --- [UPDATED] Handle Picture Upload ---
  const handlePictureSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first");
      return;
    }
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch(`${API_BASE}/api/profile/picture`, {
        method: "POST",
        headers: {
          "x-auth-token": token,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      onUserUpdate(data.user); 
      setMessage(data.message);
      setFile(null); 
      setFileName("No file selected"); // <-- Reset filename
    } catch (err) {
      setMessage(err.message || "Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  const profilePicUrl = user?.profilePicture
    ? `${API_BASE}${user.profilePicture}`
    : null;

  return (
    <div className="profile-page fade-in">
      <h1>My Profile</h1>
      <p>Manage your account settings and contact information.</p>
      {message && <p className="message" style={{textAlign: 'center'}}>{message}</p>}

      <div className="profile-grid">
        {/* === LEFT COLUMN: FORMS === */}
        <div className="profile-forms">
          {/* --- [NEW] PROFILE PIC FORM --- */}
          <form onSubmit={handlePictureSubmit} className="profile-form-card">
            <h3>
              <Upload size={18} /> Update Profile Picture
            </h3>
            <div className="profile-pic-preview">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" />
              ) : (
                <div className="profile-pic-placeholder">
                  <User size={40} />
                </div>
              )}
            </div>
            {/* --- [NEW] STYLED FILE INPUT --- */}
            <div className="form-group">
              <label>Select Image</label>
              <div className="custom-file-input">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  id="file-upload" // <-- ID for the label
                />
                {/* Styled button */}
                <label htmlFor="file-upload" className="btn-outline">
                  <File size={16} /> Choose File
                </label>
                {/* Filename display */}
                <span className="file-name">{fileName}</span>
              </div>
            </div>
            {/* ----------------------------- */}
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Picture"}
            </button>
          </form>

          {/* --- CHANGE NAME FORM --- */}
          <form onSubmit={handleNameUpdate} className="profile-form-card">
            {/* ... (form content is the same) ... */}
            <h3>
              <Save size={18} /> Update Your Name
            </h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Name"}
            </button>
          </form>
        </div>

        {/* === RIGHT COLUMN: CONTACT & FORMS === */}
        <div className="profile-sidebar">
          {/* --- CHANGE PASSWORD FORM --- */}
          <form onSubmit={handlePasswordUpdate} className="profile-form-card">
            <h3>
              <Lock size={18} /> Change Password
            </h3>
            <div className="form-group">
              <label>Old Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} // <--- TYPO FIX
                placeholder="Enter a new password"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Update Password"}
            </button>
          </form>

          {/* --- THEME SWITCHER --- */}
          <div className="profile-form-card">
            {/* ... (form content is the same) ... */}
            <h3>
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              Appearance
            </h3>
            <p>Switch between light and dark mode.</p>
            <button
              className="btn-outline"
              style={{ width: "100%" }}
              onClick={toggleTheme} 
            >
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
          </div>

          {/* --- CONTACT US CARD --- */}
          <div className="profile-form-card">
            {/* ... (form content is the same) ... */}
            <h3>Contact Us</h3>
            <p>For support, please reach out:</p>
            <div className="contact-info">
              <Mail size={16} />
              <a href="mailto:aaryatedla@gmail.com">aaryatedla@gmail.com</a>
              <a href="mailto:pavithraa2007@gmail.com">pavithraa2007@gmail.com</a>
            </div>
            <div className="contact-info">
              <Phone size={16} />
              <span>7794859836</span>
              <span>7204105657</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}