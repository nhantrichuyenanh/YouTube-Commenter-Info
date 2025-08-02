(() => {
  // SETTINGS //
  let userSettings = {
    subscriberCount: true,
    location: true,
    joinedDate: true,
    totalVideos: true,
    totalViewCount: true,
    latestVideo: true,
    playlists: true,
    description: true,
    externalLinks: true,
    businessEmail: true
  };

  // load user settings from storage
  chrome.storage.sync.get(userSettings, (settings) => {
      userSettings = settings;
    });

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

  // animations
  function applyAnimationStyles(el) {
    el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    el.style.transform = 'translateY(-10px)';
    el.style.opacity = '0';
  }

  // tooltip
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
    tooltip.textContent = text.replace(/\n/g, '\n').replace(/\\"/g, '"');
    return tooltip;
  }

  function positionTooltip(e, tooltip) {
    tooltip.style.left = (e.pageX + 10) + 'px';
    tooltip.style.top = (e.pageY + 10) + 'px';
  }

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

  // info box
  function createInfoBox(icon, text) {
    if (!text || text === 'N/A') return null;
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

    let maxLeftWidth = 0, maxMiddleWidth = 0, maxRightWidth = 0;
    const leftColumns = popup.querySelectorAll('div[style*="text-align: left"]');
    const middleColumns = popup.querySelectorAll('div[style*="text-align: center"]');
    const rightColumns = popup.querySelectorAll('div[style*="vertical-align: middle"]');

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
      // uncapitalize the first letter since extracted word would look like "Playlists"
      const localizedPlaylistWord = localizedMatch ? localizedMatch[1].charAt(0).toLowerCase() + localizedMatch[1].slice(1) : "playlist";

      return { playlists, localizedPlaylistWord };
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return { playlists: [], localizedPlaylistWord: "playlist" };
    }
  }

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

      // right column: title
      const titleColumn = createPopupCell(playlist.title || '', 'left');

      // middle column: videos
      const videosColumn = createPopupCell(playlist.videos || '', 'center');

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

      thumbnailColumn.addEventListener('click', () => {
        window.open(playlist.url, '_blank');
      });

      row.appendChild(titleColumn);
      row.appendChild(videosColumn);
      row.appendChild(thumbnailColumn);
      popup.appendChild(row);
    });

    let maxTitleWidth = 0, maxVideosWidth = 0, maxThumbnailWidth = 0;
    const titleColumns = popup.querySelectorAll('div[style*="text-align: left"]');
    const videosColumns = popup.querySelectorAll('div[style*="text-align: center"]');
    const thumbnailColumns = popup.querySelectorAll('div[style*="vertical-align: middle"]');

    titleColumns.forEach(cell => { maxTitleWidth = Math.max(maxTitleWidth, cell.offsetWidth); });
    videosColumns.forEach(cell => { maxVideosWidth = Math.max(maxVideosWidth, cell.offsetWidth); });
    thumbnailColumns.forEach(cell => { maxThumbnailWidth = Math.max(maxThumbnailWidth, cell.offsetWidth); });

    titleColumns.forEach(cell => { cell.style.width = maxTitleWidth + 'px'; });
    videosColumns.forEach(cell => { cell.style.width = maxVideosWidth + 'px'; });
    thumbnailColumns.forEach(cell => { cell.style.width = maxThumbnailWidth + 'px'; });

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

    function createPlaylistsBox(playlists, localizedPlaylistWord, channelUrl) {
    if (!playlists || playlists.length === 0) return null;

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';
    container.style.alignItems = 'center';

    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = '𝄞 ' + playlists.length + ' ' + localizedPlaylistWord;
    styleInfoBox(box);
    box.style.cursor = 'pointer';

    let isPopupOpen = false;

    box.addEventListener('click', (e) => {
      e.preventDefault();

      const existingPopup = document.querySelector('.yt-enhanced-info-popup');

      if (isPopupOpen && existingPopup) {
        existingPopup.style.transform = 'translateY(-10px)';
        existingPopup.style.opacity = '0';
        setTimeout(() => {
          existingPopup.remove();
        }, 300);
        isPopupOpen = false;
      } else {
        displayPlaylistsPopup(playlists, box);
        isPopupOpen = true;

        const originalClickOutside = document.querySelector('.yt-enhanced-info-popup');
        if (originalClickOutside) {
          const resetState = () => { isPopupOpen = false; };
          setTimeout(() => {
            if (originalClickOutside.parentNode) {
              originalClickOutside.addEventListener('remove', resetState);
            }
          }, 0);
        }
      }
    });

    container.appendChild(box);

    // redirect button if 2+ playlists
    if (playlists.length >= 2) {
      const redirectButton = createLinkBox('🎙', channelUrl + '/playlists');
      redirectButton.style.cursor = 'pointer';
      container.appendChild(redirectButton);
    }

    return container;
  }

  async function updateInfoColumns(updatedInfo, leftCol, midCol, rightCol, channelUrl) {
    leftCol.innerHTML = '';
    midCol.innerHTML = '';
    rightCol.innerHTML = '';

    // left column
    if (userSettings.subscriberCount) {
      const updatedSubBox = createInfoBox('🕭', updatedInfo.subscriberCount);
      if (updatedSubBox) leftCol.appendChild(updatedSubBox);
    }
    if (userSettings.location) {
      const updatedCountryBox = createInfoBox('🗺', updatedInfo.country);
      if (updatedCountryBox) leftCol.appendChild(updatedCountryBox);
    }
    if (userSettings.joinedDate) {
      const updatedJoinedBox = createInfoBox('🗓', updatedInfo.joinedDate);
      if (updatedJoinedBox) leftCol.appendChild(updatedJoinedBox);
    }

    // middle column
    if (userSettings.totalVideos) {
      const updatedVideoBox = createInfoBox('📽', updatedInfo.videoCount);
      if (updatedVideoBox) midCol.appendChild(updatedVideoBox);
    }
    if (userSettings.totalViewCount) {
      const updatedViewBox = createInfoBox('👁', updatedInfo.viewCount);
      if (updatedViewBox) midCol.appendChild(updatedViewBox);
    }

    // playlists
    if (userSettings.playlists) {
      const playlistsData = await fetchPlaylistsData(channelUrl);
      if (playlistsData.playlists && playlistsData.playlists.length > 0) {
        const playlistsBox = createPlaylistsBox(playlistsData.playlists, playlistsData.localizedPlaylistWord, channelUrl);
        if (playlistsBox) midCol.appendChild(playlistsBox);
      }
    }

    if (userSettings.latestVideo) {
      let updatedLatestVideoInfo = await getLatestVideoInfo(channelUrl);
      if (updatedLatestVideoInfo &&
        updatedLatestVideoInfo.title !== 'N/A' &&
        updatedLatestVideoInfo.publishedTime !== 'N/A' &&
        updatedLatestVideoInfo.length !== 'N/A' &&
        updatedLatestVideoInfo.videoViewCount !== 'N/A') {
        const updatedLatestVideoBox = createLatestVideoBox(updatedLatestVideoInfo);
        midCol.appendChild(updatedLatestVideoBox);
      }
    }

    // right column
    if (userSettings.description && updatedInfo.hasDescription) {
      const updatedDescBox = createInfoBox('🖍', ' ');
      attachDescriptionTooltip(updatedDescBox, updatedInfo.description);
      rightCol.appendChild(updatedDescBox);
    }

    if (userSettings.externalLinks && updatedInfo.hasLinks && updatedInfo.links && updatedInfo.links.length > 0) {
      const updatedLinksBox = createLinkBox('🖇', null);
      updatedLinksBox.style.cursor = 'pointer';
      updatedLinksBox.addEventListener('click', e => {
        e.preventDefault();
        displayExternalLinksPopup(updatedInfo.links, updatedLinksBox);
      });
      rightCol.appendChild(updatedLinksBox);
    }

    if (userSettings.businessEmail && updatedInfo.hasBusinessEmail && updatedInfo.businessEmail) {
      const updatedEmailBox = createLinkBox('✉︎', updatedInfo.businessEmail);
      updatedEmailBox.style.cursor = 'pointer';
      rightCol.appendChild(updatedEmailBox);
    }
  }
  
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

  const getLatestVideoInfo = async (channelUrl) => {
    const response = await fetch(channelUrl + '/videos');
    const text = await response.text();

    const titleRegex = /"title":\{"runs":\[\{"text":"([^"]+)"/;
    const titleMatch = text.match(titleRegex);
    const title = titleMatch ? titleMatch[1] : 'N/A';

    const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"/;
    const publishedTimeMatch = text.match(publishedTimeRegex);
    const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : 'N/A';

    const lengthViewRegex = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"/;
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
          cell.textContent = latestVideoInfo.videoViewCount;
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

    box.addEventListener('click', (e) => {
      e.preventDefault();
      if (latestVideoInfo.videoId) {
        window.open('https://www.youtube.com/watch?v=' + latestVideoInfo.videoId, '_blank');
      }
    });

    return box;
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

    // left column
    if (userSettings.subscriberCount) {
      const subBox = createInfoBox('🕭', channelInfo.subscriberCount);
      if (subBox) leftColumn.appendChild(subBox);
    }

    if (userSettings.location) {
      const countryBox = createInfoBox('🗺', channelInfo.country);
      if (countryBox) leftColumn.appendChild(countryBox);
    }

    if (userSettings.joinedDate) {
      const joinedBox = createInfoBox('🗓', channelInfo.joinedDate);
      if (joinedBox) leftColumn.appendChild(joinedBox);
    }

    // middle column
    if (userSettings.totalVideos) {
      const videoBox = createInfoBox('📽', channelInfo.videoCount);
      if (videoBox) middleColumn.appendChild(videoBox);
    }

    if (userSettings.totalViewCount) {
      const viewBox = createInfoBox('👁', channelInfo.viewCount);
      if (viewBox) middleColumn.appendChild(viewBox);
    }

    // latest video
    if (userSettings.latestVideo) {
      let latestVideoInfo = await getLatestVideoInfo(channelUrl);
      if (latestVideoInfo &&
          latestVideoInfo.title !== 'N/A' &&
          latestVideoInfo.publishedTime !== 'N/A' &&
          latestVideoInfo.length !== 'N/A' &&
          latestVideoInfo.videoViewCount !== 'N/A') {
        const latestVideoBox = createLatestVideoBox(latestVideoInfo);
        middleColumn.appendChild(latestVideoBox);
      }
    }

    // playlists
    if (userSettings.playlists) {
      const playlistsData = await fetchPlaylistsData(channelUrl);
      if (playlistsData.playlists && playlistsData.playlists.length > 0) {
        const playlistsBox = createPlaylistsBox(playlistsData.playlists, playlistsData.localizedPlaylistWord, channelUrl);
        if (playlistsBox) middleColumn.appendChild(playlistsBox);
      }
    }

    // right column
    if (userSettings.description && channelInfo.hasDescription) {
      const descBox = createInfoBox('🖍', ' ');
      attachDescriptionTooltip(descBox, channelInfo.description);
      rightColumn.appendChild(descBox);
    }

    if (userSettings.externalLinks && channelInfo.hasLinks && channelInfo.links && channelInfo.links.length > 0) {
      const linksBox = createLinkBox('🖇', null);
      linksBox.style.cursor = 'pointer';
      linksBox.addEventListener('click', (e) => {
        e.preventDefault();
        displayExternalLinksPopup(channelInfo.links, linksBox);
      });
      rightColumn.appendChild(linksBox);
    }

    if (userSettings.businessEmail && channelInfo.hasBusinessEmail && channelInfo.businessEmail) {
      const emailBox = createLinkBox('✉︎', channelInfo.businessEmail);
      emailBox.style.cursor = 'pointer';
      rightColumn.appendChild(emailBox);
    }

    if (leftColumn.children.length > 0) infoContainer.appendChild(leftColumn);
    if (middleColumn.children.length > 0) infoContainer.appendChild(middleColumn);
    if (rightColumn.children.length > 0) infoContainer.appendChild(rightColumn);

    const commentContent = commentElement.querySelector('#content-text');
    if (commentContent && commentContent.parentElement && infoContainer.children.length > 0) {
      commentContent.parentElement.insertBefore(infoContainer, commentContent);
    }

    const observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(async mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
          infoContainer.style.visibility = 'hidden';
          const updatedChannelUrl = commentElement.querySelector(channelUrlLookup).href;
          const updatedInfo = await getChannelInfo(updatedChannelUrl);
          await updateInfoColumns(updatedInfo, leftColumn, middleColumn, rightColumn, updatedChannelUrl);
          infoContainer.style.visibility = 'visible';
        }
      });
    });

    observer.observe(
      commentElement.querySelector(channelUrlLookup),
      { attributes: true }
    );
  };

  // MAIN // FIXED JULY 25TH 2025 BUG
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
