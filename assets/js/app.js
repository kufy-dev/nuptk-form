/* ======================================================================
   KONFIGURASI APPS SCRIPT
   Ganti URL di bawah dengan URL Web App Apps Script Anda
====================================================================== */
const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbx4Qp6_ELFtDld9mt-2Gf118qwfJkr4tw_hWJsBtZBN4oJNBrqhxXutsZTaui0mYhB_BQ/exec";

const SECURITY_TOKEN = "NUPTK-SECURE-2025"; // BISA DIGANTI SESUAI KEINGINAN

/* ======================================================================
   ELEMENT DOM
====================================================================== */

const form = document.getElementById("nuptkForm");
const submitButton = document.getElementById("submitButton");
const btnSpinner = document.getElementById("btnSpinner");

const topLoader = document.getElementById("topLoader");

const messageOverlay = document.getElementById("messageOverlay");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageClose = document.getElementById("messageClose");

/* ======================================================================
   TOP LOADING BAR
====================================================================== */
function startLoader() {
  topLoader.style.width = "0%";
  setTimeout(() => (topLoader.style.width = "50%"), 100);
}

function finishLoader() {
  topLoader.style.width = "100%";
  setTimeout(() => (topLoader.style.width = "0%"), 500);
}

/* ======================================================================
   SPINNER BUTTON
====================================================================== */
function setLoading(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    btnSpinner.classList.remove("hidden");
  } else {
    submitButton.disabled = false;
    btnSpinner.classList.add("hidden");
  }
}

/* ======================================================================
   MODAL MESSAGE
====================================================================== */
function showMessage(title, text, isError = false) {
  messageTitle.textContent = title;
  messageText.textContent = text;

  messageTitle.style.color = isError ? "#dc2626" : "#111827";

  messageOverlay.classList.remove("hidden");
}

messageClose.addEventListener("click", () => {
  messageOverlay.classList.add("hidden");
});

/* ======================================================================
   FILE → BASE64
====================================================================== */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
}

/* ======================================================================
   VALIDASI FILE PDF
====================================================================== */
function validateFiles() {
  const fileInputs = document.querySelectorAll('input[type="file"]');

  for (const input of fileInputs) {
    const label = input.closest(".file-group").querySelector("label").innerText;

    if (!input.files.length) {
      showMessage("Berkas Tidak Lengkap", `Harap unggah: ${label}`, true);
      return false;
    }

    const file = input.files[0];
    const maxSize = parseInt(input.dataset.maxSize, 10);

    if (file.type !== "application/pdf") {
      showMessage("Format Salah", `${label} harus berformat PDF`, true);
      return false;
    }

    if (file.size > maxSize) {
      showMessage(
        "Ukuran File Terlalu Besar",
        `${label} melebihi batas ${(maxSize / 1048576).toFixed(1)} MB`,
        true
      );
      return false;
    }
  }

  return true;
}

/* ======================================================================
   HANDLE FORM SUBMIT
====================================================================== */
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateFiles()) return;

  startLoader();
  setLoading(true);

  try {
    // Payload data teks
    const payload = {
      token: SECURITY_TOKEN,
      nama: document.getElementById("nama").value.trim(),
      ibu_kandung: document.getElementById("ibu_kandung").value.trim(),
      tempat_lahir: document.getElementById("tempat_lahir").value.trim(),
      tanggal_lahir: document.getElementById("tanggal_lahir").value,
      jenis_kelamin: document.getElementById("jenis_kelamin").value
    };

    // Payload file Base64
    const fileInputs = document.querySelectorAll('input[type="file"]');

    for (const input of fileInputs) {
      const file = input.files[0];
      const base64 = await readFileAsBase64(file);

      payload[input.name] = {
        name: file.name,
        mimeType: "application/pdf",
        data: base64
      };
    }

    // Kirim ke Apps Script
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      showMessage(
        "Pengajuan Berhasil",
        `Semua berkas berhasil diunggah ke folder: <b>${result.folderName}</b>`
      );
      form.reset();
    } else {
      showMessage("Gagal", result.message, true);
    }
  } catch (err) {
    console.error(err);
    showMessage("Kesalahan Server", err.message, true);
  }

  finishLoader();
  setLoading(false);
});
