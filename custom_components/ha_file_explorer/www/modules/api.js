/** HTTP client for the File Explorer API, authenticated through the HA hass object. */
const API = "/api/ha_file_explorer";

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

function buildUrl(action, params = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `${API}/${action}?${query}` : `${API}/${action}`;
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

  const request = (action, params, init = {}) =>
    fetchWithAuth(buildUrl(action, params), init);

  const json = async (action, params, { method, body, headers } = {}) => {
    const response = await request(action, params, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return response.json();
  };

  return {
    /** List the contents of a config-relative directory. */
    list(path) {
      return json("list", { path, t: Date.now() }, { method: "GET" });
    },

    /** Read a UTF-8 text file. */
    content(path) {
      return json("content", { path, t: Date.now() }, { method: "GET" });
    },

    /** Size, timestamps and permissions of one file or folder. */
    info(path) {
      return json("info", { path, t: Date.now() }, { method: "GET" });
    },

    /** Save UTF-8 text content. */
    save(path, data) {
      return json(
        "save",
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
      const response = await fetchWithAuth(buildUrl("upload", { path }), {
        method: "POST",
        body: form,
      });
      return response.json();
    },

    /** Create a file ("file") or a folder ("folder"). */
    create(act, path) {
      return json(
        "create",
        {},
        {
          method: "PUT",
          body: { act, path },
          headers: { "Content-Type": "application/json" },
        }
      );
    },

    /** Rename a file or folder. */
    rename(path, newPath) {
      return json(
        "rename",
        {},
        {
          method: "PUT",
          body: { path, new_path: newPath },
          headers: { "Content-Type": "application/json" },
        }
      );
    },

    /** Delete a file or folder. */
    remove(path) {
      return json("delete", { path }, { method: "DELETE" });
    },

    /** Fetch an image or video through the preview proxy, as a blob URL. */
    async media(path) {
      const response = await fetchWithAuth(buildUrl("preview", { path }), {
        method: "GET",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.msg || "Preview failed");
      }
      const url = URL.createObjectURL(await response.blob());
      return {
        url,
        revoke() {
          URL.revokeObjectURL(url);
        },
      };
    },

    /**
     * Local brand art of an integration (`custom_components/<domain>/brand`),
     * as a blob URL. Throws when the integration ships none.
     */
    async brand(domain, dark) {
      const response = await fetchWithAuth(
        buildUrl("brand", { domain, dark: dark ? "1" : "0" }),
        { method: "GET" }
      );
      if (!response.ok) throw new Error("No local brand icon");
      const url = URL.createObjectURL(await response.blob());
      return {
        url,
        revoke() {
          URL.revokeObjectURL(url);
        },
      };
    },

    /** Download a file (or a folder as a zip) through a temporary object URL. */
    async download(path) {
      const response = await fetchWithAuth(buildUrl("download", { path }), {
        method: "GET",
      });
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
