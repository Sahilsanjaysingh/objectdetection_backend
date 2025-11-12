# Backend for BnB Hackathon UI

This is a minimal Express backend to store uploaded images and expose them over HTTP.

Getting started

- Copy `.env.example` to `.env` and adjust `MONGO_URI`.
- Install dependencies:

  ```bash
  cd backend
  npm install
  ```

- Start the server in development:

  ```bash
  npm run dev
  ```

Endpoints

- POST /api/upload - multipart/form-data with `file` field. Returns saved Image doc (url points to /uploads/:filename). Optional `detections` JSON field can be sent to save model results.
- GET /api/images - list recent images
- GET /api/images/:id - fetch image metadata
- GET /api/settings - read simple app settings (demo in-memory store)
- PUT /api/settings - update settings (demo)
- GET /api/dashboard - aggregated metrics for frontend dashboard (totalImages, recentImages, avgConfidence)

Port behavior

- The server will read `PORT` from `.env` (default 4000) and will automatically try the next ports up to +10 if the configured port is already in use. Check the console log on startup to see which port was bound.


Notes

- This is a scaffold. Add authentication, validation, rate-limiting, and virus scanning before production use.




<!-- Good question — here’s a concise, practical breakdown of the "Detection Settings" section in your app and how to use it.

What this section does
This panel controls global detection behavior and notification preferences for the app. It includes:

Confidence Threshold: how confident the model must be before a detection is considered valid.
Max Objects: limit on how many objects the UI or logic should show/consider per image.
Notification Email: email address used for alerts (if you use the email alert feature).
Object Toggles: a list of object types (OxygenTank, FireExtinguisher, etc.) you can enable or disable; counts show how many times each type has been seen.
Send Email Alert: manual email composer that can attach a file and send via EmailJS.
Save / Reset controls: persist or reset these settings.
How to use it (step-by-step)
Adjust Confidence Threshold

Move the slider to increase/decrease the minimum confidence needed for a detection to be considered. Higher = fewer false positives, lower = more detections (including lower-confidence ones). The numeric percent to the right shows the selected threshold.
Set Max Objects

Enter the maximum number of object detections you want the UI/logic to present per image. Useful to avoid UI clutter or to limit processing.
Set a Notification Email

Enter an email address here if you want email alerts or to use the built-in "Send Email Alert" feature.
Toggle Objects on/off

Each row shows an object class name, its detected count, and a toggle checkbox:
Enabled = the object is considered by the detection workflow or by subsequent UI filters (depending on how detection consumer uses this setting).
Disabled = the object will be ignored by logic that respects these toggles (e.g., suppress alerts/visibility).
The counts are informational and come from the saved settings/metrics returned by the backend.
Save Changes

Click "Save Changes" to persist your configuration. The UI does a PUT to /api/settings and also saves a copy to localStorage as a fallback.
Reset to Defaults

Click "Reset to Defaults" to restore the initial preset values (confidence 50%, default object toggles enabled, max objects 10). This also updates localStorage.
Send Email Alert

Fill in name/email/message and optionally attach a file, then click Send. The UI will upload the attachment to your backend (/api/upload) then use EmailJS to send the message with an attachment URL.
Where the data is stored / persistence behavior
Primary store: backend settings API (GET /api/settings on load; PUT /api/settings when you save). If your backend is running and reachable, that endpoint is used to persist settings centrally.
Fallback: localStorage (key bnb_settings_v1). If the backend call fails, the component falls back to localStorage so your settings survive page reloads on the same browser.
How this affects detection & history
Saved settings (threshold / enabled object list / max objects) are intended to influence how detections are interpreted or filtered. For example:
The frontend or backend could filter detection results by the confidence threshold and the enabled object list before saving/displaying them in History.
The History page reads images and detection metadata from the backend; if the backend returns objectCounts, the Settings UI displays those counts.
Note: for the toggles/threshold to actually change detection behavior, the detection step (either the frontend or backend consumer) has to read these settings and filter the raw detection results. If you deploy the whole stack, the intended flow is:
Run detection.
Enrich results with detectedAt/detector.
Persist via PUT /api/images/:id.
The UI and settings-aware logic then filter/display those saved results.
Troubleshooting (if changes don't appear to stick)
Make sure the backend is running and reachable (the Settings component does a GET and PUT to VITE_API_URL or http://localhost:4000).
Open browser DevTools → Network and check GET /api/settings (on page load) and PUT /api/settings (when you save). If those fail, you’ll see the error/HTTP status.
If PUT is blocked by CORS or returns 4xx/5xx, check backend logs; earlier I adjusted CORS to allow PUT/PATCH but you must restart the backend to pick that up.
If the UI shows counts as zero, the backend may not be populating objectCounts; the History and Settings components expect the backend to return those values (or they fall back to localStorage).
Recommended values & tips
Confidence Threshold: start at 0.6–0.7 for production (0.6 gives better recall, 0.7 reduces false positives).
Max Objects: set to what you can reasonably inspect in the UI (5–20 depending on scene density).
Use toggles to silence types you don’t care about (e.g., if you only monitor FireExtinguisher, disable others).
Save after changing settings. If you want quick local testing, rely on localStorage but remember it won’t sync between browsers/devices. -->