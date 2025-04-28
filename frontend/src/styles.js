/* frontend/src/styles.css */

/* Container styles */
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3));
}

.header {
  padding: 0.5rem 1rem;
  background: linear-gradient(to right, #ede9fe, #fce7f3);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.branding {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #7C3AED, #EC4899);
  -webkit-background-clip: text;
  color: transparent;
}

.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.icon {
  width: 20px;
  height: 20px;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #A78BFA;
  border-radius: 9999px;
  color: #7C3AED;
  cursor: pointer;
}

.add-counselor-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #EC4899;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.add-student-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #10B981;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #3B82F6;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.mood-selector-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #8B5CF6;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #6B7280;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.sign-out-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #9CA3AF;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 9999px;
  width: 150px;
}

@media (min-width: 640px) {
  .search-input {
    width: 200px;
  }
}

.campus-selector {
  padding: 0.5rem;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.main {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.loading {
  font-size: 1.25rem;
  color: #7C3AED;
  text-align: center;
  margin-top: 40px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.thead {
  background: linear-gradient(to right, #EDE9FE, #FCE7F3);
  position: sticky;
  top: 0;
}

.th {
  padding: 8px 12px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7C3AED;
  text-transform: uppercase;
  border-bottom: 1px solid #D1D5DB;
}

.td {
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #4B5563;
  border-bottom: 1px solid #E5E7EB;
}

.link {
  color: #3B82F6;
  text-decoration: underline;
}

.delete-button {
  background: transparent;
  border: none;
  cursor: pointer;
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip-text {
  visibility: hidden;
  width: 200px;
  background-color: #111827;
  color: white;
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4B5563;
}

.modal-input {
  padding: 0.5rem;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  font-size: 0.875rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background-color: #6B7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-button {
  padding: 0.5rem 1rem;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3));
  padding: 1rem;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  max-width: 450px;
  width: 100%;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section {
  padding: 0;
  border-bottom: 1px solid #E5E7EB;
}

.events-section {
  padding: 0;
  border-bottom: 1px solid #E5E7EB;
}

.notes-section {
  padding: 0;
}

.events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.event-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.add-event-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #10B981;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.edit-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #3B82F6;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #10B981;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.cancel-edit-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #6B7280;
  border: none;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.notes-textarea {
  padding: 0.5rem;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  width: 100%;
  color: #4B5563;
}

.notes-textarea::placeholder {
  color: #9CA3AF;
  font-style: italic;
}

.student-info-grid {
  display: grid;
  gap: 0.05rem;
  font-size: 0.875rem;
  color: #4B5563;
  line-height: 1.2;
}

.event-action-button {
  background: transparent;
  border: none;
  cursor: pointer;
  margin-left: 4px;
}

.custom-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.custom-popup {
  background-color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  width: 100%;
  text-align: center;
}

.custom-popup-message {
  font-size: 1rem;
  color: #1F2937;
  margin-bottom: 1rem;
}

.custom-popup-button {
  padding: 0.5rem 1rem;
  background-color: #8B5CF6;
  color: white;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 0.875rem;
}

.custom-popup-cancel-button {
  padding: 0.5rem 1rem;
  background-color: #6B7280;
  color: white;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}
