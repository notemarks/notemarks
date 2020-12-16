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

// inspired by: https://gist.github.com/jbinto/119c3f0e5735ab73faaa
export const getTitle = async (url: string) => {
  try {
    if (!(url.startsWith("http:") || url.startsWith("https:"))) {
      url = "http://" + url;
    }
    const response = await fetch(url);
    const html = await response.text();

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
