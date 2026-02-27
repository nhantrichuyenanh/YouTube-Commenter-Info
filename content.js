(() => {
  // SETTINGS //
  let userSettings = {
    // column 1
    subscriberCount: true,
    location: true,
    joinedDate: true,

    // column 2
    totalVideos: true,
    totalViewCount: true,
    playlists: true,

    // column 3
    latestVideo: true,
    latestShorts: true,
    latestLivestream: true,

    // column 4
    description: true,
    externalLinks: true,
    businessEmail: true,

    infoBoxPosition: 'below'
  };

  browser.storage.sync.get(userSettings, (settings) => { userSettings = settings; });

  // UI STYLE CONSTANTS //
  const PADDING = '4px 8px';
  const BORDER_RADIUS = '4px';
  const GAP = '4px';
  const FONT_SIZE = '1rem';
  const POPUP_ZINDEX = '1000000';
  const BORDER_STYLE = '1px solid rgba(128,128,128,0.2)';
  const GENERAL_BACKGROUND = 'var(--yt-spec-menu-background, var(--yt-spec-general-background-a))'; // tbh var(--yt-spec-general-background-a) doesn't matter but who cares lol
  const TEXT_COLOR = 'var(--yt-spec-text-primary)';
  const BOX_SHADOW = '0 2px 8px rgba(0,0,0,0.15)';

  // UTILITY / DOM, STYLE, TOOLTIP, POPUP HELPERS //
  function decodeEscapedString(s) { // decodes sequences like \u0026 and \ to & and " respectively
    if (s === null || s === undefined) return s;
    if (typeof s !== 'string') return s;

    try {
      const safe = '"' + s.replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
      return JSON.parse(safe);
    } catch (e) {
      try {
        return s
          .replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16)))
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r');
      } catch (e2) {
        return s;
      }
    }
  }

  function createInfoBox(icon, text) {
    if (!text) return null;
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = icon + ' ' + text;
    styleInfoBox(box);
    return box;
  }

  function styleInfoBox(el) {
    el.style.background = GENERAL_BACKGROUND;
    el.style.color = TEXT_COLOR;
    el.style.padding = PADDING;
    el.style.borderRadius = BORDER_RADIUS;
    el.style.border = BORDER_STYLE;
    el.style.fontSize = FONT_SIZE;
    el.style.width = 'fit-content';
    el.style.position = 'relative';
  }

  function createPopup(anchorEl, buildRows) {
    let popup = document.createElement('div');
    popup.className = 'yt-enhanced-info-popup';
    popup.style.position = 'absolute';
    popup.style.background = GENERAL_BACKGROUND;
    popup.style.color = TEXT_COLOR;
    popup.style.padding = '8px';
    popup.style.border = BORDER_STYLE;
    popup.style.borderRadius = BORDER_RADIUS;
    popup.style.boxShadow = BOX_SHADOW;
    popup.style.zIndex = POPUP_ZINDEX;
    popup.style.display = 'table';
    popup.style.borderSpacing = GAP;
    applyAnimationStyles(popup);

    buildRows(popup);

    const leftColumns = popup.querySelectorAll('div[style*="text-align: left"]');
    const middleColumns = popup.querySelectorAll('div[style*="text-align: center"]');
    const rightColumns = popup.querySelectorAll('div[style*="vertical-align: middle"]');

    let maxLeftWidth = 0, maxMiddleWidth = 0, maxRightWidth = 0;
    leftColumns.forEach(cell => { maxLeftWidth = Math.max(maxLeftWidth, cell.offsetWidth); });
    middleColumns.forEach(cell => { maxMiddleWidth = Math.max(maxMiddleWidth, cell.offsetWidth); });
    rightColumns.forEach(cell => { maxRightWidth = Math.max(maxRightWidth, cell.offsetWidth); });
    leftColumns.forEach(cell => { cell.style.width = maxLeftWidth + 'px'; });
    middleColumns.forEach(cell => { cell.style.width = maxMiddleWidth + 'px'; });
    rightColumns.forEach(cell => { cell.style.width = maxRightWidth + 'px'; });

    const existingPopup = document.querySelector('.yt-enhanced-info-popup');
    if (existingPopup) { existingPopup.remove(); }

    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      popup.style.transform = 'translateY(0)';
      popup.style.opacity = '1';
    });

    const rect = anchorEl.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';

    function onClickOutside(e) {
      if (!popup.contains(e.target) && e.target !== anchorEl) {
        popup.style.transform = 'translateY(-10px)';
        popup.style.opacity = '0';
        setTimeout(() => {
          popup.remove();
          document.removeEventListener('click', onClickOutside);
        }, 300);
      }
    }
    document.addEventListener('click', onClickOutside);
  }

  function togglePopup(element, openFn) {
    let isPopupOpen = false;
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const existingPopup = document.querySelector('.yt-enhanced-info-popup');
      if (isPopupOpen && existingPopup) {
        existingPopup.style.transform = 'translateY(-10px)';
        existingPopup.style.opacity = '0';
        setTimeout(() => { existingPopup.remove(); }, 300);
        isPopupOpen = false;
      } else {
        openFn(element);
        isPopupOpen = true;
      }
    });
  }

  function displayPopupPlaylists(playlists, anchorEl) {
    createPopup(anchorEl, (popup) => {
      playlists.forEach(playlist => {
        const row = document.createElement('div');
        row.style.display = 'table-row';

        const titleColumn = createPopupCell(playlist.title, 'left');
        const videosColumn = createPopupCell(playlist.videos, 'center');

        const thumbnailColumn = document.createElement('a');
        thumbnailColumn.style.display = 'table-cell';
        thumbnailColumn.style.padding = PADDING;
        thumbnailColumn.style.border = BORDER_STYLE;
        thumbnailColumn.style.borderRadius = BORDER_RADIUS;
        thumbnailColumn.style.fontSize = FONT_SIZE;
        thumbnailColumn.style.textAlign = 'center';
        thumbnailColumn.style.verticalAlign = 'middle';
        thumbnailColumn.href = playlist.url;
        thumbnailColumn.target = '_blank';
        thumbnailColumn.rel = 'noopener noreferrer';
        thumbnailColumn.style.textDecoration = 'none';

        if (playlist.thumbnail) {
          const img = document.createElement('img');
          img.src = playlist.thumbnail;
          img.style.width = '60px';
          img.style.height = '45px';
          img.style.borderRadius = '2px';
          thumbnailColumn.appendChild(img);
        }

        row.appendChild(titleColumn);
        row.appendChild(videosColumn);
        row.appendChild(thumbnailColumn);
        popup.appendChild(row);
      });
    });
  }

  function displayPopupExternalLinks(links, anchorEl) {
    createPopup(anchorEl, (popup) => {
      links.forEach(item => {
        if (!item.link) return;
        let linkStr = item.link;
        if (!/^https?:\/\//i.test(linkStr)) {
          linkStr = 'https://www.' + linkStr.replace(/^www\./i, '');
        }

        const row = document.createElement('div');
        row.style.display = 'table-row';

        const leftColumn = createPopupCell(item.title, 'left');

        const middleColumn = document.createElement('a');
        middleColumn.href = linkStr;
        middleColumn.target = '_blank';
        middleColumn.rel = 'noopener noreferrer';
        middleColumn.style.display = 'table-cell';
        middleColumn.style.padding = PADDING;
        middleColumn.style.border = BORDER_STYLE;
        middleColumn.style.borderRadius = BORDER_RADIUS;
        middleColumn.style.fontSize = FONT_SIZE;
        middleColumn.style.textAlign = 'center';
        middleColumn.style.verticalAlign = 'middle';
        middleColumn.style.textDecoration = 'none';
        if (item.icon) {
          const img = document.createElement('img');
          img.src = item.icon;
          img.style.width = '16px';
          img.style.height = '16px';
          middleColumn.appendChild(img);
        }

        row.appendChild(leftColumn);
        row.appendChild(middleColumn);
        popup.appendChild(row);
      });
    });
  }

  function createPopupCell(text, align) {
    const cell = document.createElement('div');
    cell.style.display = 'table-cell';
    cell.style.padding = PADDING;
    cell.style.border = BORDER_STYLE;
    cell.style.borderRadius = BORDER_RADIUS;
    cell.style.fontSize = FONT_SIZE;
    cell.style.textAlign = align;
    cell.style.verticalAlign = 'middle';
    cell.textContent = text;
    return cell;
  }

  function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.style.background = GENERAL_BACKGROUND;
    tooltip.style.color = TEXT_COLOR;
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = BORDER_RADIUS;
    tooltip.style.border = BORDER_STYLE;
    tooltip.style.fontSize = FONT_SIZE;
    tooltip.style.position = 'absolute';
    tooltip.style.whiteSpace = 'pre-wrap';
    tooltip.style.zIndex = POPUP_ZINDEX + 1;
    tooltip.style.display = 'none';
    tooltip.style.boxShadow = BOX_SHADOW;
    applyAnimationStyles(tooltip);
    tooltip.textContent = text.replace(/\\"/g, '"');
    return tooltip;
  }

  function positionTooltip(e, tooltip) {
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
  }

  function attachTooltip(element, descriptionText) {
    if (!descriptionText) return;
    const tooltip = createTooltip(descriptionText);
    document.body.appendChild(tooltip);

    element.addEventListener('mouseover', (e) => {
      tooltip.style.display = 'block';
      positionTooltip(e, tooltip);
      requestAnimationFrame(() => {
        tooltip.style.transform = 'translateY(0)';
        tooltip.style.opacity = '1';
      });
    });

    element.addEventListener('mousemove', (e) => {
      positionTooltip(e, tooltip);
    });

    element.addEventListener('mouseout', () => {
      tooltip.style.transform = 'translateY(-10px)';
      tooltip.style.opacity = '0';
      setTimeout(() => { tooltip.style.display = 'none'; }, 300);
    });
  }

  function createLinkBox(iconText, aboutUrl) {
    const link = document.createElement('a');
    link.className = 'yt-enhanced-info-item';
    link.textContent = iconText;
    if (aboutUrl) {
      link.href = aboutUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    styleInfoBox(link);
    return link;
  }

  function createColumn() {
    const col = document.createElement('div');
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    col.style.gap = '4px';
    return col;
  }

  function applyAnimationStyles(el) {
    el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    el.style.transform = 'translateY(-10px)';
    el.style.opacity = '0';
  }

  // DATA FETCHING //
  const getChannelInfo = async (channelUrl) => {
    const response = await fetch(channelUrl + '/about');
    const text = await response.text();
    const hugeRegex = /"subscriberCountText":"([^"]+)","viewCountText":"([^"]+)","joinedDateText":\{"content":"([^"]+)"/;
    let subscriberCount, viewCount, joinedDate;
    const hugeMatch = text.match(hugeRegex);

    if (hugeMatch) {
      subscriberCount = hugeMatch[1];
      viewCount = hugeMatch[2];
      joinedDate = hugeMatch[3];
    } else {
      const subRegex = /"subscriberCountText":"([^"]+)"/;
      const subMatch = text.match(subRegex);
      subscriberCount = subMatch ? subMatch[1] : null;
      const viewRegex = /"viewCountText":"([^"]+)"/;
      const viewMatch = text.match(viewRegex);
      viewCount = viewMatch ? viewMatch[1] : null;
      const joinRegex = /"joinedDateText":\{"content":"([^"]+)"/;
      const joinMatch = text.match(joinRegex);
      joinedDate = joinMatch ? joinMatch[1] : null;
    }

    const countryRegex = /"country":"([^"]+)"/;
    const countryMatch = text.match(countryRegex);
    const country = countryMatch ? decodeEscapedString(countryMatch[1]) : null;
    const videoCountRegex = /"videoCountText":"([^"]+)"/;
    const videoCountMatch = text.match(videoCountRegex);
    const videoCount = videoCountMatch ? videoCountMatch[1] : null;
    let description = null;
    const descRegex1 = /"description":"((?:\\.|[^"\\])*)"/;
    const descMatch1 = text.match(descRegex1);

    if (descMatch1 && descMatch1[1].trim() !== "") {
      description = decodeEscapedString(descMatch1[1]);
    }

    const externalLinkRegex = /"channelExternalLinkViewModel":\{"title":\{"content":"((?:\\.|[^"\\])*)"\},"link":\{"content":"((?:\\.|[^"\\])*)"/g;
    let externalLinks = [];
    let match;
    while ((match = externalLinkRegex.exec(text)) !== null) {
      externalLinks.push({
        title: decodeEscapedString(match[1]).trim(),
        link: match[2].trim(),
        icon: null });
    }

    const iconRegex = /"url":"([^"]+)","width":256,"height":256/g;
    let iconMatch;
    let icons = [];
    while ((iconMatch = iconRegex.exec(text)) !== null) {
      icons.push(iconMatch[1].trim());
    }
    for (let i = 0; i < externalLinks.length; i++) {
      externalLinks[i].icon = icons[i] || null;
    }
    if (externalLinks.length === 0) {
      externalLinks = null;
    }

    const emailRegex = /"businessEmailRevealButton":/;
    const hasBusinessEmail = emailRegex.test(text);
    const businessEmail = hasBusinessEmail ? channelUrl + '/about' : null;

    return {
      subscriberCount,
      country,
      joinedDate,
      videoCount,
      viewCount,
      description,
      links: externalLinks,
      hasDescription: !!description,
      hasLinks: externalLinks !== null,
      businessEmail,
      hasBusinessEmail: !!businessEmail
    };
  };

  const getLatestVideoInfo = async (channelUrl) => {
    try {
      const response = await fetch(channelUrl + '/videos');
      const text = await response.text();

      const titleRegex = /"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/;
      const titleMatch = text.match(titleRegex);
      const title = titleMatch ? decodeEscapedString(titleMatch[1]) : null;

      const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"/;
      const publishedTimeMatch = text.match(publishedTimeRegex);
      const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : null;

      const lengthViewRegex = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"/;
      const lengthViewMatch = text.match(lengthViewRegex);
      const lengthText = lengthViewMatch ? lengthViewMatch[1] : null;
      const videoViewCount = lengthViewMatch ? lengthViewMatch[2] : null;

      const linkRegex = /{"content":{"videoRenderer":{"videoId":"([^"]+)"/;
      const linkMatch = text.match(linkRegex);
      const videoId = linkMatch ? linkMatch[1] : null;

      const thumbnailRegex = /"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/;
      const thumbnailMatch = text.match(thumbnailRegex);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

      return {
        title,
        publishedTime,
        length: lengthText,
        videoViewCount,
        videoId,
        thumbnail
      };
    } catch (e) {
      return {
        title: null,
        publishedTime: null,
        length: null,
        videoViewCount: null,
        videoId: null,
        thumbnail: null
      };
    }

  };

  const getLatestShortInfo = async (channelUrl) => {
    try {

      const response = await fetch(channelUrl + '/shorts');
      const text = await response.text();

      const shortRegex = /"overlayMetadata":\{"primaryText":\{"content":"((?:\\.|[^"\\])*)"\},"secondaryText":\{"content":"([^"]+)"\}\},"thumbnailViewModel":\{"thumbnailViewModel":\{"image":\{"sources":\[\{"url":"([^"]+)"/;
      const m = text.match(shortRegex);

      const title = m && m[1] ? decodeEscapedString(m[1]) : null;
      const views = m && m[2] ? m[2] : null;
      const thumbnail = m && m[3] ? m[3] : null;

      const vidRegex = /"reelWatchEndpoint"\s*:\s*\{\s*"videoId"\s*:\s*"([^"]+)"/;
      let vidMatch = text.match(vidRegex);
      let videoId = vidMatch ? vidMatch[1] : null;

      return {
        title,
        views,
        thumbnail,
        videoId
      };
    } catch (e) {
      return {
        title: null,
        views: null,
        thumbnail: null,
        videoId: null
      };
    }
  };

  const getLatestLivestreamInfo = async (channelUrl) => {
    try {
      const response = await fetch(channelUrl + '/streams');
      const text = await response.text();

      const liveBadgeRegex = /"metadataBadgeRenderer"\s*:\s*\{\s*"icon"\s*:\s*\{\s*"iconType"\s*:\s*"CHECK_CIRCLE_THICK"/;
      const hasLiveBadge = !!text.match(liveBadgeRegex);

      if (!hasLiveBadge) {
        return {
          title: null,
          publishedTime: null,
          length: null,
          videoViewCount: null,
          videoId: null,
          thumbnail: null
        };
      }

      const titleRegex = /"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/;
      const titleMatch = text.match(titleRegex);
      const title = titleMatch ? decodeEscapedString(titleMatch[1]) : null;

      const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"/;
      const publishedTimeMatch = text.match(publishedTimeRegex);
      const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : null;

      const lengthViewRegex = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"/;
      const lengthViewMatch = text.match(lengthViewRegex);
      const lengthText = lengthViewMatch ? lengthViewMatch[1] : null;
      const videoViewCount = lengthViewMatch ? lengthViewMatch[2] : null;

      const linkRegex = /{"content":{"videoRenderer":{"videoId":"([^"]+)"/;
      const linkMatch = text.match(linkRegex);
      const videoId = linkMatch ? linkMatch[1] : null;

      const thumbnailRegex = /"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/;
      const thumbnailMatch = text.match(thumbnailRegex);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

      return {
        title,
        publishedTime,
        length: lengthText,
        videoViewCount,
        videoId,
        thumbnail
      };
    } catch (e) {
      return {
        title: null,
        publishedTime: null,
        length: null,
        videoViewCount: null,
        videoId: null,
        thumbnail: null
      };
    }
  };

  async function fetchPlaylistsData(channelUrl) {
    try {
      const response = await fetch(channelUrl + '/playlists');
      const text = await response.text();

      const playlists = [];

      const titleRegex = /"metadata":\{"lockupMetadataViewModel":\{"title":\{"content":"((?:\\.|[^"\\])*)"/g;
      const urlRegex = /"url":"\/playlist\?list=([^"]+)"/g;
      const thumbnailRegex = /"thumbnailViewModel":{"image":{"sources":\[\{"url":"([^"]+)"/g;
      const videosRegex = /,"text":"([^"]+)"/g;

      const titleMatches = [...text.matchAll(titleRegex)];
      let urlMatches = [...text.matchAll(urlRegex)];
      let thumbnailMatches = [...text.matchAll(thumbnailRegex)];
      let videosMatches = [...text.matchAll(videosRegex)];

      for (let i = 0; i < titleMatches.length; i++) {
        if (titleMatches[i] && urlMatches[i] && thumbnailMatches[i] && videosMatches[i]) {
          playlists.push({
            title: decodeEscapedString(titleMatches[i][1]),
            url: 'https://www.youtube.com/playlist?list=' + urlMatches[i][1],
            thumbnail: thumbnailMatches[i][1],
            videos: videosMatches[i][1]
          });
        }
      }

      // extract localized word for "playlist"
      const localizedRegex = /"title":"([^"]+)","selected":true/;
      const localizedMatch = text.match(localizedRegex);
      // uncapitalize the first letter since extracted word would look like "Playlists"
      const localizedPlaylistWord = localizedMatch ? localizedMatch[1].charAt(0).toLowerCase() + localizedMatch[1].slice(1) : "playlist";

      return { playlists, localizedPlaylistWord };
    } catch (error) {
      return { playlists: [], localizedPlaylistWord: "playlist" };
    }
  }

  // UI BUILDERS //
  function createMediaTooltipBox(icon, info, clickUrl) {
    const box = document.createElement('a');
    box.href = clickUrl;
    box.target = '_blank';
    box.rel = 'noopener noreferrer';
    box.style.textDecoration = 'none';
    box.className = 'yt-enhanced-info-item';
    box.textContent = icon + ' ' + info.publishedTime;
    styleInfoBox(box);
    let tooltip;

    box.addEventListener('mouseover', (e) => {
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'yt-enhanced-latest-video-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.background = GENERAL_BACKGROUND;
        tooltip.style.color = TEXT_COLOR;
        tooltip.style.padding = '4px';
        tooltip.style.border = BORDER_STYLE;
        tooltip.style.borderRadius = BORDER_RADIUS;
        tooltip.style.boxShadow = BOX_SHADOW;
        tooltip.style.zIndex = POPUP_ZINDEX;
        tooltip.style.display = 'block';
        tooltip.style.flexDirection = 'column';
        tooltip.style.gap = GAP;
        applyAnimationStyles(tooltip);

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.gap = GAP;
        topRow.style.marginBottom = '4px';

        const viewsCell = (() => {
          const cell = document.createElement('div');
          cell.style.flex = '1';
          cell.style.display = 'flex';
          cell.style.alignItems = 'center';
          cell.style.justifyContent = 'center';
          cell.style.padding = PADDING;
          cell.style.border = BORDER_STYLE;
          cell.style.borderRadius = BORDER_RADIUS;
          cell.style.fontSize = FONT_SIZE;
          cell.textContent = info.videoViewCount;
          return cell;
        })();

        const lengthCell = (() => {
          const cell = document.createElement('div');
          cell.style.flex = '1';
          cell.style.display = 'flex';
          cell.style.alignItems = 'center';
          cell.style.justifyContent = 'center';
          cell.style.padding = PADDING;
          cell.style.border = BORDER_STYLE;
          cell.style.borderRadius = BORDER_RADIUS;
          cell.style.fontSize = FONT_SIZE;
          cell.textContent = info.length;
          return cell;
        })();

        topRow.appendChild(viewsCell);
        topRow.appendChild(lengthCell);

        const middleRow = document.createElement('div');
        middleRow.style.display = 'flex';
        middleRow.style.justifyContent = 'center';
        middleRow.style.alignItems = 'center';
        middleRow.style.marginBottom = '4px';

        if (info.thumbnail) {
          const thumbnailImg = document.createElement('img');
          thumbnailImg.src = info.thumbnail;
          thumbnailImg.style.borderRadius = BORDER_RADIUS;
          thumbnailImg.style.border = BORDER_STYLE;
          thumbnailImg.style.maxWidth = '150px';
          thumbnailImg.style.height = 'auto';
          thumbnailImg.addEventListener('load', () => {
            tooltip.style.width = thumbnailImg.offsetWidth + 'px';
          });
          middleRow.appendChild(thumbnailImg);
        }

        const bottomRow = document.createElement('div');
        bottomRow.style.padding = PADDING;
        bottomRow.style.border = BORDER_STYLE;
        bottomRow.style.borderRadius = BORDER_RADIUS;
        bottomRow.style.fontSize = FONT_SIZE;
        bottomRow.style.whiteSpace = 'normal';
        bottomRow.style.wordBreak = 'break-word';
        bottomRow.textContent = info.title;

        tooltip.appendChild(topRow);
        tooltip.appendChild(middleRow);
        tooltip.appendChild(bottomRow);
        document.body.appendChild(tooltip);

        const rect = box.getBoundingClientRect();
        tooltip.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        requestAnimationFrame(() => {
          tooltip.style.transform = 'translateY(0)';
          tooltip.style.opacity = '1';
        });
      }
    });

    box.addEventListener('mousemove', (e) => {
      if (tooltip) positionTooltip(e, tooltip);
    });

    box.addEventListener('mouseout', () => {
      if (tooltip) {
        tooltip.style.transform = 'translateY(-10px)';
        tooltip.style.opacity = '0';
        setTimeout(() => {
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        }, 300);
      }
    });

    return box;
  }

  function createLatestVideoBox(latestVideoInfo) {
    return createMediaTooltipBox(
      '▷',
      latestVideoInfo,
      'https://www.youtube.com/watch?v=' + latestVideoInfo.videoId
    );
  }

  function createLatestShortBox(latestShortInfo, channelUrl) {
    const shortUrl = latestShortInfo.videoId ? 'https://www.youtube.com/shorts/' + latestShortInfo.videoId : channelUrl + '/shorts';
    const box = document.createElement('a');
    box.href = shortUrl;
    box.target = '_blank';
    box.rel = 'noopener noreferrer';
    box.style.textDecoration = 'none';
    box.className = 'yt-enhanced-info-item';
    box.textContent = '🎞 ' + latestShortInfo.views;
    styleInfoBox(box);
    let tooltip;

    box.addEventListener('mouseover', (e) => {
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'yt-enhanced-latest-short-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.background = GENERAL_BACKGROUND;
        tooltip.style.color = TEXT_COLOR;
        tooltip.style.padding = '4px';
        tooltip.style.border = BORDER_STYLE;
        tooltip.style.borderRadius = BORDER_RADIUS;
        tooltip.style.boxShadow = BOX_SHADOW;
        tooltip.style.zIndex = POPUP_ZINDEX;
        tooltip.style.display = 'block';
        tooltip.style.flexDirection = 'column';
        tooltip.style.gap = GAP;
        applyAnimationStyles(tooltip);

        const middleRow = document.createElement('div');
        middleRow.style.display = 'flex';
        middleRow.style.justifyContent = 'center';
        middleRow.style.alignItems = 'center';
        middleRow.style.marginBottom = '4px';

        if (latestShortInfo.thumbnail) {
          const thumbnailImg = document.createElement('img');
          thumbnailImg.src = latestShortInfo.thumbnail;
          thumbnailImg.style.borderRadius = BORDER_RADIUS;
          thumbnailImg.style.border = BORDER_STYLE;
          thumbnailImg.style.maxWidth = '150px';
          thumbnailImg.style.height = 'auto';
          thumbnailImg.addEventListener('load', () => {
            tooltip.style.width = thumbnailImg.offsetWidth + 'px';
          });
          middleRow.appendChild(thumbnailImg);
        }

        const bottomRow = document.createElement('div');
        bottomRow.style.padding = PADDING;
        bottomRow.style.border = BORDER_STYLE;
        bottomRow.style.borderRadius = BORDER_RADIUS;
        bottomRow.style.fontSize = FONT_SIZE;
        bottomRow.style.whiteSpace = 'normal';
        bottomRow.style.wordBreak = 'break-word';
        bottomRow.textContent = latestShortInfo.title;

        tooltip.appendChild(middleRow);
        tooltip.appendChild(bottomRow);
        document.body.appendChild(tooltip);

        const rect = box.getBoundingClientRect();
        tooltip.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        requestAnimationFrame(() => {
          tooltip.style.transform = 'translateY(0)';
          tooltip.style.opacity = '1';
        });
      }
    });

    box.addEventListener('mousemove', (e) => {
      if (tooltip) positionTooltip(e, tooltip);
    });

    box.addEventListener('mouseout', () => {
      if (tooltip) {
        tooltip.style.transform = 'translateY(-10px)';
        tooltip.style.opacity = '0';
        setTimeout(() => {
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        }, 300);
      }
    });

    return box;
  }

  function createLatestLivestreamBox(latestLiveInfo) {
    return createMediaTooltipBox(
      '◉',
      latestLiveInfo,
      'https://www.youtube.com/watch?v=' + latestLiveInfo.videoId
    );
  }

  function createPlaylistsBox(playlists, localizedPlaylistWord, channelUrl) {
    if (!playlists || playlists.length === 0) return null;

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';
    container.style.alignItems = 'center';

    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = '𝄞 ' + (playlists.length >= 30 ? '30+' : playlists.length) + ' ' + localizedPlaylistWord;
    styleInfoBox(box);
    box.style.cursor = 'pointer';

    togglePopup(box, (el) => displayPopupPlaylists(playlists, el));

    container.appendChild(box);

    // redirect button appears if commenter has more than 1 playlists
    if (playlists.length >= 2) {
      const redirectButton = createLinkBox('☰♪', channelUrl + '/playlists');
      redirectButton.style.cursor = 'pointer';
      redirectButton.style.textDecoration = 'none';
      container.appendChild(redirectButton);
    }

    return container;
  }

  // COLUMNS //
  async function buildInfoColumns(info, firstCol, secondCol, thirdCol, fourthCol, channelUrl) {
    // firstColumn
    if (userSettings.subscriberCount) {
      const subBox = createInfoBox('🕭', info.subscriberCount);
      if (subBox) firstCol.appendChild(subBox);
    }
    if (userSettings.location) {
      const countryBox = createInfoBox('🗺', info.country);
      if (countryBox) firstCol.appendChild(countryBox);
    }
    if (userSettings.joinedDate) {
      const joinedBox = createInfoBox('🗓', info.joinedDate);
      if (joinedBox) firstCol.appendChild(joinedBox);
    }

    // secondColumn
    if (userSettings.totalVideos) {
      const videoBox = createInfoBox('📽', info.videoCount);
      if (videoBox) secondCol.appendChild(videoBox);
    }
    if (userSettings.totalViewCount) {
      const viewBox = createInfoBox('👁', info.viewCount);
      if (viewBox) secondCol.appendChild(viewBox);
    }
    const [playlistsData] = await Promise.all([userSettings.playlists? fetchPlaylistsData(channelUrl): Promise.resolve(null)]);
    if (playlistsData && playlistsData.playlists && playlistsData.playlists.length > 0) {
      const playlistsBox = createPlaylistsBox(playlistsData.playlists, playlistsData.localizedPlaylistWord, channelUrl);
      if (playlistsBox) secondCol.appendChild(playlistsBox);
    }

    // thirdColumn
    const [latestVideoInfo, latestShortInfo, latestLiveInfo] = await Promise.all([
      userSettings.latestVideo      ? getLatestVideoInfo(channelUrl)      : Promise.resolve(null),
      userSettings.latestShorts     ? getLatestShortInfo(channelUrl)      : Promise.resolve(null),
      userSettings.latestLivestream ? getLatestLivestreamInfo(channelUrl) : Promise.resolve(null),
    ]);

    if (latestVideoInfo &&
        latestVideoInfo.title !== null &&
        latestVideoInfo.publishedTime !== null &&
        latestVideoInfo.length !== null &&
        latestVideoInfo.videoViewCount !== null) {
      thirdCol.appendChild(createLatestVideoBox(latestVideoInfo));
    }
    if (latestShortInfo && latestShortInfo.title !== null && latestShortInfo.views !== null) {
      thirdCol.appendChild(createLatestShortBox(latestShortInfo, channelUrl));
    }
    if (latestLiveInfo && latestLiveInfo.videoId) {
      thirdCol.appendChild(createLatestLivestreamBox(latestLiveInfo));
    }

    // fourthColumn
    if (userSettings.description && info.hasDescription) {
      const descBox = createInfoBox('🖍', ' ');
      attachTooltip(descBox, info.description);
      fourthCol.appendChild(descBox);
    }
    if (userSettings.externalLinks && info.hasLinks && info.links && info.links.length > 0) {
      const linksBox = createLinkBox('🖇', null);
      linksBox.style.cursor = 'pointer';
      togglePopup(linksBox, (el) => displayPopupExternalLinks(info.links, el));
      fourthCol.appendChild(linksBox);
    }
    if (userSettings.businessEmail && info.hasBusinessEmail && info.businessEmail) {
      const emailBox = createLinkBox('✉︎', info.businessEmail);
      emailBox.style.cursor = 'pointer';
      emailBox.style.textDecoration = 'none';
      fourthCol.appendChild(emailBox);
    }
  }

  async function updateInfoColumns(updatedInfo, firstCol, secondCol, thirdCol, fourthCol, channelUrl) { // runs when channel URL changes
    firstCol.innerHTML = '';
    secondCol.innerHTML = '';
    thirdCol.innerHTML = '';
    fourthCol.innerHTML = '';
    await buildInfoColumns(updatedInfo, firstCol, secondCol, thirdCol, fourthCol, channelUrl);
  }

  const addChannelInfo = async (commentElement) => {
    const channelUrlLookup = 'div#header-author a';
    const headerElement = commentElement.querySelector('div#header-author');
    if (!headerElement) return;

    const oldInfoContainer = commentElement.querySelector('.yt-enhanced-info');
    if (oldInfoContainer) {
      oldInfoContainer.remove();
    }

    const channelUrlElement = commentElement.querySelector(channelUrlLookup);
    if (!channelUrlElement) return;

    const channelUrl = channelUrlElement.href;
    const channelInfo = await getChannelInfo(channelUrl);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'yt-enhanced-info';
    infoContainer.style.display = 'flex';
    infoContainer.style.gap = '8px';
    infoContainer.style.marginTop = '4px';
    infoContainer.style.marginBottom = '8px';
    infoContainer.style.width = '100%';
    infoContainer.style.maxWidth = '800px';

    const firstColumn = createColumn();
    const secondColumn = createColumn();
    const thirdColumn = createColumn();
    const fourthColumn = createColumn();

    await buildInfoColumns(channelInfo, firstColumn, secondColumn, thirdColumn, fourthColumn, channelUrl);

    if (firstColumn.children.length > 0) infoContainer.appendChild(firstColumn);
    if (secondColumn.children.length > 0) infoContainer.appendChild(secondColumn);
    if (thirdColumn.children.length > 0) infoContainer.appendChild(thirdColumn);
    if (fourthColumn.children.length > 0) infoContainer.appendChild(fourthColumn);

    if (infoContainer.children.length > 0) {
      if (userSettings.infoBoxPosition === 'adjacent') {
        const headerAuthor = commentElement.querySelector('#header-author');
        if (headerAuthor) {
          infoContainer.style.marginLeft = '8px';
          infoContainer.style.marginTop = '0px';
          infoContainer.style.marginBottom = '0px';
          headerAuthor.appendChild(infoContainer);
        }
      } else {
        const commentContent = commentElement.querySelector('#content-text');
        if (commentContent && commentContent.parentElement) {
          commentContent.parentElement.insertBefore(infoContainer, commentContent);
        }
      }
    }

    const observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(async mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
          infoContainer.style.visibility = 'hidden';
          const updatedChannelUrl = commentElement.querySelector(channelUrlLookup).href;
          const updatedInfo = await getChannelInfo(updatedChannelUrl);
          await updateInfoColumns(updatedInfo, firstColumn, secondColumn, thirdColumn, fourthColumn, updatedChannelUrl);
          infoContainer.style.visibility = 'visible';
        }
      });
    });

    observer.observe(
      commentElement.querySelector(channelUrlLookup),
      { attributes: true }
    );
  };

  // MAIN //
  const commentObserver = new MutationObserver(mutationsList => {
    const processedElements = new Set();

    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(el => {
        if (el.nodeType === Node.ELEMENT_NODE) {
          // comments
          if (el.matches('ytd-comment-thread-renderer')) {
            const commentElement = el.querySelector('ytd-comment-view-model');
            if (commentElement && !processedElements.has(commentElement)) {
              processedElements.add(commentElement);
              addChannelInfo(commentElement);
            }
          }

          // replies
          if (el.matches('ytd-comment-view-model') && !processedElements.has(el)) {
            processedElements.add(el);
            addChannelInfo(el);
          }

          const nestedComments = el.querySelectorAll('ytd-comment-view-model');
          nestedComments.forEach(commentElement => {
            if (!processedElements.has(commentElement)) {
              processedElements.add(commentElement);
              addChannelInfo(commentElement);
            }
          });
        }
      });
    });
  });

  commentObserver.observe(
    document.querySelector('ytd-app'),
    { childList: true, subtree: true }
  );

})();
