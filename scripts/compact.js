(() => {
  // UI STYLE CONSTANTS //
  const PADDING = '4px 8px';
  const BORDER_RADIUS = '4px';
  const GAP = '4px';
  const FONT_SIZE = '1rem';
  const POPUP_ZINDEX = '1000000';
  const BORDER_STYLE = '1px solid rgba(128,128,128,0.2)';
  const GENERAL_BACKGROUND = 'var(--yt-spec-general-background-a, #fff)';
  const TEXT_COLOR = 'var(--yt-spec-text-primary, #000)';
  const BOX_SHADOW = '0 2px 8px rgba(0,0,0,0.15)';

  // HELPER FUNCTIONS //
  function applyAnimationStyles(el) {
    el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    el.style.transform = 'translateY(-10px)';
    el.style.opacity = '0';
  }

  /**
   * tooltip
   * @param {string} text -> tooltip text
   * @returns {HTMLElement} -> tooltip element
   */
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
    tooltip.textContent = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    return tooltip;
  }

  /**
   * tooltip positioning
   * @param {MouseEvent} e -> mouse event
   * @param {HTMLElement} tooltip -> tooltip element to position
   */
  function positionTooltip(e, tooltip) {
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
  }

  /**
   * info box
   * @param {string} icon -> emoji/icon text
   * @param {string} text -> info text
   * @returns {HTMLElement|null}
   */
  function createInfoBox(icon, text) {
    if (!text || text === 'N/A') return null;
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = icon + ' ' + text;
    styleInfoBox(box);
    return box;
  }

  /**
   * info box styling
   * @param {HTMLElement} el -> element to style
   */
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

  /**
   * description tooltip
   * @param {HTMLElement} element -> element to attach tooltip to
   * @param {string} descriptionText -> tooltip text
   */
  function attachDescriptionTooltip(element, descriptionText) {
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

  /**
   * link box
   * @param {string} iconText -> emoji/icon text
   * @param {string|null} aboutUrl -> URL if available
   * @returns {HTMLElement}
   */
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

  /**
   * link box dropdown cell
   * @param {string} text -> cell text content
   * @param {string} align -> text alignment
   * @returns {HTMLElement}
   */
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

  /**
   * link box tooltip for external links
   * @param {Array} links -> array of external link objects
   * @param {HTMLElement} anchorEl -> element to attach tooltip to
   */
  function displayExternalLinksPopup(links, anchorEl) {
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

    links.forEach(item => {
      if (!item.link) return;
      let linkStr = item.link;
      if (!/^https?:\/\//i.test(linkStr)) {
        linkStr = 'https://www.' + linkStr.replace(/^www\./i, '');
      }

      const row = document.createElement('div');
      row.style.display = 'table-row';

      const leftColumn = createPopupCell(item.title || '', 'left');

      const middleColumn = createPopupCell('', 'center');
      if (item.icon) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.style.width = '16px';
        img.style.height = '16px';
        middleColumn.appendChild(img);
      }

      const rightColumn = document.createElement('div');
      rightColumn.style.display = 'table-cell';
      rightColumn.style.padding = PADDING;
      rightColumn.style.border = BORDER_STYLE;
      rightColumn.style.borderRadius = BORDER_RADIUS;
      rightColumn.style.fontSize = FONT_SIZE;
      rightColumn.style.textAlign = 'left';
      rightColumn.style.verticalAlign = 'middle';

      const anchor = document.createElement('a');
      anchor.href = linkStr;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = linkStr.replace(/^https:\/\/www\./, '');
      anchor.style.color = '#3ea2f7';
      anchor.style.textDecoration = 'none';
      rightColumn.appendChild(anchor);

      row.appendChild(leftColumn);
      row.appendChild(middleColumn);
      row.appendChild(rightColumn);
      popup.appendChild(row);
    });

    // remove any existing popup first
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

  /**
   * fetch playlists data from /playlists
   * @param {string} channelUrl
   * @returns {Object}
   */
  async function fetchPlaylistsData(channelUrl) {
    try {
      const response = await fetch(channelUrl + '/playlists');
      const text = await response.text();

      // store playlist information
      const playlists = [];

      // playlist regex
      const titleRegex = /"metadata":{"lockupMetadataViewModel":{"title":{"content":"([^"]+)"/g;
      const urlRegex = /"url":"\/playlist\?list=([^"]+)"/g;
      const thumbnailRegex = /"thumbnailViewModel":{"image":{"sources":\[\{"url":"([^"]+)"/g;
      const videosRegex = /,"text":"([^"]+)"/g;

      let titleMatches = [...text.matchAll(titleRegex)];
      let urlMatches = [...text.matchAll(urlRegex)];
      let thumbnailMatches = [...text.matchAll(thumbnailRegex)];
      let videosMatches = [...text.matchAll(videosRegex)];

      for (let i = 0; i < titleMatches.length; i++) {
        if (titleMatches[i] && urlMatches[i] && thumbnailMatches[i] && videosMatches[i]) {
          playlists.push({
            title: titleMatches[i][1],
            url: 'https://www.youtube.com/playlist?list=' + urlMatches[i][1],
            thumbnail: thumbnailMatches[i][1],
            videos: videosMatches[i][1]
          });
        }
      }

      // extract localized word for "playlist"
      const localizedRegex = /"title":"([^"]+)","selected":true/;
      const localizedMatch = text.match(localizedRegex);
      const localizedPlaylistWord = localizedMatch ? localizedMatch[1].charAt(0).toLowerCase() + localizedMatch[1].slice(1) : "playlist";

      return { playlists, localizedPlaylistWord };
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return { playlists: [], localizedPlaylistWord: "playlist" };
    }
  }

  /**
   * display playlists popup under the playlists info box
   * @param {Array} playlists
   * @param {HTMLElement} anchorEl
   */
  function displayPlaylistsPopup(playlists, anchorEl) {
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

    playlists.forEach(playlist => {
      const row = document.createElement('div');
      row.style.display = 'table-row';
      row.style.cursor = 'pointer';

      // left column: thumbnail
      const thumbnailColumn = document.createElement('div');
      thumbnailColumn.style.display = 'table-cell';
      thumbnailColumn.style.padding = PADDING;
      thumbnailColumn.style.border = BORDER_STYLE;
      thumbnailColumn.style.borderRadius = BORDER_RADIUS;
      thumbnailColumn.style.fontSize = FONT_SIZE;
      thumbnailColumn.style.textAlign = 'center';
      thumbnailColumn.style.verticalAlign = 'middle';

      if (playlist.thumbnail) {
        const img = document.createElement('img');
        img.src = playlist.thumbnail;
        img.style.width = '60px';
        img.style.height = '45px';
        img.style.borderRadius = '2px';
        img.style.cursor = 'pointer';
        thumbnailColumn.appendChild(img);
      }

      // middle column: total videos
      const videosColumn = createPopupCell(playlist.videos || '', 'center');

      // right column: title
      const titleColumn = createPopupCell(playlist.title || '', 'left');

      row.appendChild(titleColumn);
      row.appendChild(videosColumn);
      row.appendChild(thumbnailColumn);
      popup.appendChild(row);
    });

    // remove any existing popup
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

  /**
   * playlists
   * @param {Array} playlists
   * @param {string} localizedPlaylistWord
   * @returns {HTMLElement|null}
   */
  function createPlaylistsBox(playlists, localizedPlaylistWord, channelUrl) {
    if (!playlists || playlists.length === 0) return null;
  
    // container for both the playlist‐count box and redirect button
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';
    container.style.alignItems = 'center';
  
    // main playlists box
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = '𝄞 ' + playlists.length + ' ' + localizedPlaylistWord;
    styleInfoBox(box);
    box.style.cursor = 'pointer';
    box.addEventListener('click', (e) => {
      e.preventDefault();
      displayPlaylistsPopup(playlists, box);
    });
    container.appendChild(box);
  
    // redirect button if 2+ const playlistsData
    if (playlists.length >= 2) {
      const redirectButton = createLinkBox('🎙', channelUrl + '/playlists');
      redirectButton.style.cursor = 'pointer';
      container.appendChild(redirectButton);
    }
  
    return container;
  }

  /**
   * fetch /about
   * @param {string} channelUrl
   * @returns {Object}
   */
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
    const country = countryMatch ? countryMatch[1] : null;
    const videoCountRegex = /"videoCountText":"([^"]+)"/;
    const videoCountMatch = text.match(videoCountRegex);
    const videoCount = videoCountMatch ? videoCountMatch[1] : null;
    let description = null;
    const descRegex1 = /"description":"((?:\\.|[^"\\])*)"/;
    const descMatch1 = text.match(descRegex1);

    if (descMatch1 && descMatch1[1].trim() !== "") {
      try {
        description = JSON.parse('"' + descMatch1[1] + '"');
      } catch (e) {
        description = descMatch1[1];
      }
    }

    const externalLinkRegex = /"channelExternalLinkViewModel":\{"title":\{"content":"([^"]+)"\},"link":\{"content":"([^"]+)"/g;
    let externalLinks = [];
    let match;
    while ((match = externalLinkRegex.exec(text)) !== null) {
      externalLinks.push({ title: match[1].trim(), link: match[2].trim(), icon: null });
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
      hasLinks: !!(externalLinks && externalLinks.length > 0),
      businessEmail,
      hasBusinessEmail: !!businessEmail
    };
  };

  /**
   * fetch latest video
   * @param {string} channelUrl
   * @returns {Object}
   */
  const getLatestVideoInfo = async (channelUrl) => {
    const response = await fetch(channelUrl + '/videos');
    const text = await response.text();

    const titleRegex = /"title":\{"runs":\[\{"text":"([^"]+)"/;
    const titleMatch = text.match(titleRegex);
    const title = titleMatch ? titleMatch[1] : 'N/A';

    const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"\}/;
    const publishedTimeMatch = text.match(publishedTimeRegex);
    const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : 'N/A';

    const lengthViewRegex = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"\}/;
    const lengthViewMatch = text.match(lengthViewRegex);
    const lengthText = lengthViewMatch ? lengthViewMatch[1] : 'N/A';
    const videoViewCount = lengthViewMatch ? lengthViewMatch[2] : 'N/A';

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
  };

  /**
   * latest video
   * @param {Object} latestVideoInfo
   * @returns {HTMLElement}
   */
  function createLatestVideoBox(latestVideoInfo) {
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = '▷ ' + latestVideoInfo.publishedTime;
    styleInfoBox(box);
    box.style.cursor = 'pointer';
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

        const viewsCell = (function () {
          const cell = document.createElement('div');
          cell.style.flex = '1';
          cell.style.display = 'flex';
          cell.style.alignItems = 'center';
          cell.style.justifyContent = 'center';
          cell.style.padding = PADDING;
          cell.style.border = BORDER_STYLE;
          cell.style.borderRadius = BORDER_RADIUS;
          cell.style.fontSize = FONT_SIZE;
          cell.textContent = latestVideoInfo.videoViewCount;
          return cell;
        })();

        const lengthCell = (function () {
          const cell = document.createElement('div');
          cell.style.flex = '1';
          cell.style.display = 'flex';
          cell.style.alignItems = 'center';
          cell.style.justifyContent = 'center';
          cell.style.padding = PADDING;
          cell.style.border = BORDER_STYLE;
          cell.style.borderRadius = BORDER_RADIUS;
          cell.style.fontSize = FONT_SIZE;
          cell.textContent = latestVideoInfo.length;
          return cell;
        })();

        topRow.appendChild(viewsCell);
        topRow.appendChild(lengthCell);
        const middleRow = document.createElement('div');
        middleRow.style.display = 'flex';
        middleRow.style.justifyContent = 'center';
        middleRow.style.alignItems = 'center';
        middleRow.style.marginBottom = '4px';

        if (latestVideoInfo.thumbnail) {
          const thumbnailImg = document.createElement('img');
          thumbnailImg.src = latestVideoInfo.thumbnail;
          thumbnailImg.style.borderRadius = BORDER_RADIUS;
          thumbnailImg.style.border = BORDER_STYLE;
          thumbnailImg.style.maxWidth = '150px';
          thumbnailImg.style.height = 'auto';
          thumbnailImg.style.cursor = 'pointer';
          thumbnailImg.addEventListener('click', () => {
            if (latestVideoInfo.videoId) {
              window.open('https://www.youtube.com/watch?v=' + latestVideoInfo.videoId, '_blank');
            }
          });
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
        bottomRow.textContent = latestVideoInfo.title;

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
      if (tooltip) { positionTooltip(e, tooltip); }
    });

    box.addEventListener('mouseout', () => {
      if (tooltip) {
        tooltip.style.transform = 'translateY(-10px)';
        tooltip.style.opacity = '0';
        setTimeout(() => { if (tooltip) { tooltip.remove(); tooltip = null; } }, 300);
      }
    });

    box.addEventListener('click', (e) => {
      e.preventDefault();
      if (latestVideoInfo.videoId) {
        window.open('https://www.youtube.com/watch?v=' + latestVideoInfo.videoId, '_blank');
      }
    });
    return box;
  }

  /**
   * @param {HTMLElement} commentElement
   */
  const addChannelInfo = async (commentElement) => {
    const authorElement = commentElement.querySelector('div#header-author, .author');
    if (!authorElement) return;

    const existingToggle = authorElement.querySelector('.yt-enhanced-info-toggle');
    if (existingToggle) existingToggle.remove();

    const channelUrlElement = commentElement.querySelector('div#header-author a');
    if (!channelUrlElement) return;
    const channelUrl = channelUrlElement.href;

    const [channelInfo, latestVideoInfo, playlistsData] = await Promise.all([
      getChannelInfo(channelUrl),
      getLatestVideoInfo(channelUrl),
      fetchPlaylistsData(channelUrl)
    ]);

    const interactive = (
      (latestVideoInfo && latestVideoInfo.title !== 'N/A' && latestVideoInfo.publishedTime !== 'N/A' &&
       latestVideoInfo.length !== 'N/A' && latestVideoInfo.videoViewCount !== 'N/A') ||
      (playlistsData && playlistsData.playlists && playlistsData.playlists.length > 0) ||
      channelInfo.hasLinks || channelInfo.hasBusinessEmail || channelInfo.hasDescription
    );

    const infoContainer = document.createElement('div');
    infoContainer.className = 'yt-enhanced-info-container';
    infoContainer.style.position = 'absolute';
    infoContainer.style.background = GENERAL_BACKGROUND;
    infoContainer.style.border = BORDER_STYLE;
    infoContainer.style.borderRadius = BORDER_RADIUS;
    infoContainer.style.boxShadow = BOX_SHADOW;
    infoContainer.style.padding = '8px';
    infoContainer.style.display = 'flex';
    infoContainer.style.gap = '8px';
    infoContainer.style.zIndex = POPUP_ZINDEX;

    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '4px';

    const middleColumn = document.createElement('div');
    middleColumn.style.display = 'flex';
    middleColumn.style.flexDirection = 'column';
    middleColumn.style.gap = '4px';

    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '4px';

    // left column: subscriber count, country, joined date
    const subBox = createInfoBox('🕭', channelInfo.subscriberCount);
    const countryBox = createInfoBox('🗺', channelInfo.country);
    const joinedBox = createInfoBox('🗓', channelInfo.joinedDate);
    if (subBox) leftColumn.appendChild(subBox);
    if (countryBox) leftColumn.appendChild(countryBox);
    if (joinedBox) leftColumn.appendChild(joinedBox);

    // middle column: video count, view count, latest video, playlists
    const videoBox = createInfoBox('📽', channelInfo.videoCount);
    const viewBox = createInfoBox('👁', channelInfo.viewCount);
    if (videoBox) middleColumn.appendChild(videoBox);
    if (viewBox) middleColumn.appendChild(viewBox);
    if (latestVideoInfo && latestVideoInfo.title !== 'N/A' && latestVideoInfo.publishedTime !== 'N/A' &&
        latestVideoInfo.length !== 'N/A' && latestVideoInfo.videoViewCount !== 'N/A') {
      const latestVideoBox = createLatestVideoBox(latestVideoInfo, channelUrl);
      middleColumn.appendChild(latestVideoBox);
    }
    if (playlistsData && playlistsData.playlists && playlistsData.playlists.length > 0) {
      const playlistsBox = createPlaylistsBox(playlistsData.playlists, playlistsData.localizedPlaylistWord, channelUrl);
      if (playlistsBox) middleColumn.appendChild(playlistsBox);
    }

    // right column: description, external links, business email
    if (channelInfo.hasDescription) {
      const descBox = createInfoBox('🖍', ' ');
      attachDescriptionTooltip(descBox, channelInfo.description);
      rightColumn.appendChild(descBox);
    }
    if (channelInfo.hasLinks && channelInfo.links && channelInfo.links.length > 0) {
      const linksBox = createLinkBox('🖇', null);
      linksBox.style.cursor = 'pointer';
      linksBox.addEventListener('click', e => {
        e.preventDefault();
        displayExternalLinksPopup(channelInfo.links, linksBox);
      });
      rightColumn.appendChild(linksBox);
    }
    if (channelInfo.hasBusinessEmail && channelInfo.businessEmail) {
      const emailBox = createLinkBox('✉︎', channelInfo.businessEmail);
      emailBox.style.cursor = 'pointer';
      rightColumn.appendChild(emailBox);
    }

    if (leftColumn.children.length > 0) infoContainer.appendChild(leftColumn);
    if (middleColumn.children.length > 0) infoContainer.appendChild(middleColumn);
    if (rightColumn.children.length > 0) infoContainer.appendChild(rightColumn);

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'yt-enhanced-info-toggle';
    toggleIcon.textContent = interactive ? 'ⓘ▾' : 'ⓘ';
    toggleIcon.style.color = '#aaaaaa';
    toggleIcon.style.cursor = 'pointer';
    toggleIcon.style.marginLeft = '4px';

    toggleIcon.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    toggleIcon.addEventListener('mouseenter', () => {
      toggleIcon.style.transform = 'scale(1.1)';
    });
    toggleIcon.addEventListener('mouseleave', () => {
      toggleIcon.style.transform = 'scale(1)';
    });
    toggleIcon.addEventListener('mousedown', () => {
      toggleIcon.style.transform = 'scale(0.95)';
    });
    toggleIcon.addEventListener('mouseup', () => {
      toggleIcon.style.transform = 'scale(1.1)';
    });

    authorElement.appendChild(toggleIcon);

    function showInfoContainer() {
      const rect = toggleIcon.getBoundingClientRect();
      infoContainer.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      infoContainer.style.left = (rect.left + window.scrollX) + 'px';
      infoContainer.style.opacity = '0';
      infoContainer.style.transform = 'translateY(-10px)';
      document.body.appendChild(infoContainer);
      requestAnimationFrame(() => {
        infoContainer.style.opacity = '1';
        infoContainer.style.transform = 'translateY(0)';
      });
      applyAnimationStyles(infoContainer);
    }

    function hideInfoContainer() {
      if (document.body.contains(infoContainer)) {
        infoContainer.style.transform = 'translateY(-10px)';
        infoContainer.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(infoContainer)) {
            document.body.removeChild(infoContainer);
          }
        }, 300);
      }
    }

    if (!interactive) {
      toggleIcon.addEventListener('mouseover', showInfoContainer);
      toggleIcon.addEventListener('mousemove', (e) => {
        infoContainer.style.top = (e.pageY + 10) + 'px';
        infoContainer.style.left = (e.pageX + 10) + 'px';
      });
      toggleIcon.addEventListener('mouseout', hideInfoContainer);
    } else {
      toggleIcon.addEventListener('click', (e) => {
        e.preventDefault();
        if (document.body.contains(infoContainer)) {
          hideInfoContainer();
          applyAnimationStyles(infoContainer);
        } else {
          if (window.__openInfoContainer && window.__openInfoContainer !== infoContainer) {
            window.__openInfoContainer.remove();
          }
          window.__openInfoContainer = infoContainer;
          showInfoContainer();
        }
      });
      document.addEventListener('click', function onDocClick(event) {
        if (!toggleIcon.contains(event.target) && !infoContainer.contains(event.target)) {
          hideInfoContainer();
        }
      });
    }
  };

  // MAIN //
  const commentObserver = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(el => {
        if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
          addChannelInfo(el);
        }
      });
    });
  });

  commentObserver.observe(
    document.querySelector('ytd-app'),
    { childList: true, subtree: true }
  );
})();