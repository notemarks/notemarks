function getDomain(url: string): string | undefined {
  // https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
  try {
    let trueURL = new URL(url);
    return trueURL.hostname;
  } catch {
    return undefined;
  }
}

function getYouTubeTitle(text: string) {
  // For now we use a regex, but this "noembed.com" based solution seems nice:
  // https://stackoverflow.com/a/32190892/1804173
  // Using the official API is not really an option because we need an API key...
  let regex = /\\"title\\":\\"(.*?)\\"/g;
  let match = regex.exec(text);
  // console.log(match);
  if (match) {
    return "YouTube – " + match[1];
  }
}

export const fetchBody = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();
  return html;
};

export const fetchBodyProxied = async (url: string) => {
  // TODO: Eventually we should really run our own proxy.
  let urlProxied = `https://cors-anywhere.herokuapp.com/${url
    .replace("http://", "")
    .replace("https://", "")}`;
  return fetchBody(urlProxied);
};

// Inspired by: https://gist.github.com/jbinto/119c3f0e5735ab73faaa
export const getTitle = async (url: string) => {
  try {
    const html = await fetchBodyProxied(url);

    let domain = getDomain(url);

    if (domain === "www.youtube.com") {
      let title = getYouTubeTitle(html);
      if (title !== undefined) {
        return title;
      }
    }

    // Fallback to return plain page title
    const doc = new DOMParser().parseFromString(html, "text/html");
    const title = doc.querySelectorAll("title")[0];
    return title.innerText;
  } catch (e) {
    console.log("Failed to request title:", e);
    return undefined;
  }
};

function getMediaType(extension: string) {
  // https://en.wikipedia.org/wiki/Media_type
  // https://stackoverflow.com/a/6783972/1804173
  extension = extension.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "svg":
      return "image/svg";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export function downloadFromMemory(filename: string, extension: string, dataBase64: string) {
  // https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
  // https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  // https://en.wikipedia.org/wiki/Data_URI_scheme

  let mediaType = getMediaType(extension);

  var element = document.createElement("a");
  element.setAttribute("href", `data:${mediaType};base64,${dataBase64}`);
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function gtagLoginEvent() {
  (window as any).gtag("event", "login", {});
}

export function gtagDemoEvent() {
  (window as any).gtag("event", "demo", {});
}
