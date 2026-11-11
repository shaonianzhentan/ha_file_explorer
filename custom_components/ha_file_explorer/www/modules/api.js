/** HTTP client for the File Explorer API, authenticated through the HA hass object. */
const API_URL = "/ha_file_explorer-api";

function filenameFromDisposition(disposition) {
  if (!disposition) return "download";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch (_err) {
      /* fall through to the plain filename */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : "download";
}

export function createApi(hass) {
  const fetchWithAuth = (path, init) => {
    if (hass && typeof hass.fetchWithAuth === "function") {
      return hass.fetchWithAuth(path, init);
    }
    const token = hass && hass.auth && hass.auth.accessToken;
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(path, { credentials: "same-origin", ...init, headers });
  };

  const request = (query, init = {}) =>
    fetchWithAuth(`${API_URL}?${new URLSearchParams(query)}`, init);

  const json = async (query, { method, body, headers } = {}) => {
    const response = await request(query, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return response.json();
  };

  return {
    /** List the contents of a config-relative directory. */
    list(path) {
      return json({ act: "get", path, t: Date.now() }, { method: "GET" });
    },

    /** Read a UTF-8 text file. */
    content(path) {
      return json({ act: "content", path, t: Date.now() }, { method: "GET" });
    },

    /** Save UTF-8 text content. */
    save(path, data) {
      return json(
        {},
        {
          method: "POST",
          body: { path, data },
          headers: { "Content-Type": "application/json" },
        }
      );
    },

    /** Upload a single file as multipart/form-data. */
    async upload(path, file) {
      const form = new FormData();
      form.append("file", file, file.name);
      const response = await request({ path }, { method: "POST", body: form });
      return response.json();
    },

    /** Create a file ("file") or a folder ("folder"). */
    create(act, path) {
      return json(
        { act },
        {
          method: "PUT",
          body: { path },
          headers: { "Content-Type": "application/json" },
        }
      );
    },

    /** Rename a file or folder. */
    rename(path, newPath) {
      return json(
        { act: "rename" },
        {
          method: "PUT",
          body: { path, new_path: newPath },
          headers: { "Content-Type": "application/json" },
        }
      );
    },

    /** Delete a file or folder. */
    remove(path) {
      return json({ path }, { method: "DELETE" });
    },

    /** Download a file (or a folder as a zip) through a temporary object URL. */
    async download(path) {
      const response = await request({ act: "download", path }, { method: "GET" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.msg || "Download failed");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(
        response.headers.get("Content-Disposition")
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
}
