(() => {
  console.log('YouTube™ Ultimate Comment Section Enhancer, forked from Commenter Subscribers for YouTube™');

  // STYLE SETTINGS //
  const BORDER_STYLE = '1px solid rgba(128,128,128,0.2)';
  const GENERAL_BACKGROUND = 'var(--yt-spec-general-background-a, #fff)';
  const TEXT_COLOR = 'var(--yt-spec-text-primary, #000)';
  const PADDING = '4px 8px';
  const BORDER_RADIUS = '4px';
  const FONT_SIZE = '1rem';
  const BOX_SHADOW = '0 2px 8px rgba(0,0,0,0.15)';
  const GAP = '4px';
  const POPUP_ZINDEX = '1000000';
  const TOOLTIP_OFFSET = 10;

  // HELPER FUNCTIONS //

  /**
   * creates and returns a tooltip element with the given text
   * it's styled to appear above other elements
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
    tooltip.textContent = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    return tooltip;
  }

  /**
   * positions the tooltip relative to the mouse event
   * @param {MouseEvent} e -> mouse event
   * @param {HTMLElement} tooltip -> tooltip element
   */
  function positionTooltip(e, tooltip) {
    tooltip.style.left = (e.pageX + TOOLTIP_OFFSET) + 'px';
    tooltip.style.top = (e.pageY + TOOLTIP_OFFSET) + 'px';
  }

  /**
   * applies a consistent style to an info box element
   * @param {HTMLElement} el -> style element
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
   * creates an info box element with an emoji and text
   * if text is falsy or "N/A"
   * @param {string} icon -> emoji
   * @param {string} text -> text
   * @returns {HTMLElement|null} -> info box element
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
   * attaches a hover tooltip to the given element
   * when the mouse hovers over the element, the tooltip appears
   * @param {HTMLElement} element - tooltip to attach to
   * @param {string} descriptionText - tooltip text
   */
  function enableDescriptionHover(element, descriptionText) {
    if (!descriptionText) return;
    const tooltip = createTooltip(descriptionText);
    document.body.appendChild(tooltip);
    element.addEventListener('mouseover', (e) => {
      tooltip.style.display = 'block';
      positionTooltip(e, tooltip);
    });
    element.addEventListener('mousemove', (e) => {
      positionTooltip(e, tooltip);
    });
    element.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });
  }

  /**
   * creates a clickable link box element
   * if an aboutUrl is provided, the box becomes a normal link
   * @param {string} iconText -> text or icon
   * @param {string|null} aboutUrl -> URL to link to (if provided)
   * @returns {HTMLElement} -> link box
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
   * displays a popup containing external links arranged in a table-like structure
   * each row is a table row with three columns:
   *    - left: title
   *    - middle: icon
   *    - right: link
   * adjusted to the maximum width found, ensuring uniform height and compact spacing
   * @param {Array} links -> array of external link objects
   * @param {HTMLElement} anchorEl -> popup to anchor to
   */
  function showExternalLinksPopup(links, anchorEl) {
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

    // use table display for a table-like layout with three columns
    popup.style.display = 'table';
    popup.style.borderSpacing = GAP;

    links.forEach(item => {
      if (!item.link) return;
      let linkStr = item.link;
      if (!/^https?:\/\//i.test(linkStr)) {
        linkStr = 'https://www.' + linkStr.replace(/^www\./i, '');
      }
      const row = document.createElement('div');
      row.style.display = 'table-row';

      // left column: title
      const leftColumn = document.createElement('div');
      leftColumn.className = 'left-cell';
      leftColumn.style.display = 'table-cell';
      leftColumn.style.padding = PADDING;
      leftColumn.style.border = BORDER_STYLE;
      leftColumn.style.borderRadius = BORDER_RADIUS;
      leftColumn.style.fontSize = '0.9rem';
      leftColumn.style.textAlign = 'left';
      leftColumn.style.verticalAlign = 'middle';
      leftColumn.textContent = item.title || '';
      row.appendChild(leftColumn);

      // middle column: icon
      const middleColumn = document.createElement('div');
      middleColumn.className = 'middle-cell';
      middleColumn.style.display = 'table-cell';
      middleColumn.style.padding = PADDING;
      middleColumn.style.border = BORDER_STYLE;
      middleColumn.style.borderRadius = BORDER_RADIUS;
      middleColumn.style.textAlign = 'center';
      middleColumn.style.verticalAlign = 'middle';
      if (item.icon) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.style.width = '16px';
        img.style.height = '16px';
        middleColumn.appendChild(img);
      }
      row.appendChild(middleColumn);

      // right column: link
      const rightColumn = document.createElement('div');
      rightColumn.className = 'right-cell';
      rightColumn.style.display = 'table-cell';
      rightColumn.style.padding = PADDING;
      rightColumn.style.border = BORDER_STYLE;
      rightColumn.style.borderRadius = BORDER_RADIUS;
      rightColumn.style.textAlign = 'left';
      rightColumn.style.verticalAlign = 'middle';
      const linkAnchor = document.createElement('a');
      linkAnchor.href = linkStr;
      linkAnchor.target = '_blank';
      linkAnchor.rel = 'noopener noreferrer';
      let displayText = linkStr.replace(/^https:\/\/www\./, '');
      linkAnchor.textContent = displayText;
      linkAnchor.style.color = '#3ea2f7';
      linkAnchor.style.textDecoration = 'none';
      rightColumn.appendChild(linkAnchor);
      row.appendChild(rightColumn);

      popup.appendChild(row);
    });

    // compute maximum widths for each column to enforce uniformity
    let maxLeftWidth = 0, maxMiddleWidth = 0, maxRightWidth = 0;
    const leftColumns = popup.querySelectorAll('.left-cell');
    const middleColumns = popup.querySelectorAll('.middle-cell');
    const rightColumns = popup.querySelectorAll('.right-cell');
    leftColumns.forEach(cell => {
      maxLeftWidth = Math.max(maxLeftWidth, cell.offsetWidth);
    });
    middleColumns.forEach(cell => {
      maxMiddleWidth = Math.max(maxMiddleWidth, cell.offsetWidth);
    });
    rightColumns.forEach(cell => {
      maxRightWidth = Math.max(maxRightWidth, cell.offsetWidth);
    });
    leftColumns.forEach(cell => {
      cell.style.width = maxLeftWidth + 'px';
    });
    middleColumns.forEach(cell => {
      cell.style.width = maxMiddleWidth + 'px';
    });
    rightColumns.forEach(cell => {
      cell.style.width = maxRightWidth + 'px';
    });

    const existingPopup = document.querySelector('.yt-enhanced-info-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    document.body.appendChild(popup);
    const rect = anchorEl.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';

    function onClickOutside(e) {
      if (!popup.contains(e.target) && e.target !== anchorEl) {
        popup.remove();
        document.removeEventListener('click', onClickOutside);
      }
    }
    document.addEventListener('click', onClickOutside);
  }

  /**
   * fetches channel information from the channel’s about page
   * extracts subscriber count, country, joined date, video count, view count, published time, description, and external links
   * for description, it uses a regex to check for non‑empty content
   * external links (with titles) are extracted via regex, and link icons are associated by index
   * @param {string} channelUrl -> URL of the channel
   * @returns {Object} -> extracted channel info
   */
  const getChannelInfo = async (channelUrl) => {
    if (channelUrl.startsWith('http://')) {
      channelUrl = channelUrl.replace('http://', 'https://');
    }
    const response = await fetch(channelUrl + '/about');
    const text = await response.text();

    // subscriber count
    const subRegex = /"subscriberCountText":"([^"]+)"/;
    const subMatch = text.match(subRegex);
    const subscriberCount = subMatch ? subMatch[1] : null;

    // country
    const countryRegex = /"country":"([^"]+)"/;
    const countryMatch = text.match(countryRegex);
    const country = countryMatch ? countryMatch[1] : null;

    // joined date
    const joinedDateRegex = /"joinedDateText":\{"content":"([^"]+)"/;
    const joinedDateMatch = text.match(joinedDateRegex);
    const joinedDate = joinedDateMatch ? joinedDateMatch[1] : null;

    // video count
    const videoCountRegex = /"videoCountText":"([^"]+)"/;
    const videoCountMatch = text.match(videoCountRegex);
    const videoCount = videoCountMatch ? videoCountMatch[1] : null;

    // latest video's view count
    const viewCountRegex = /"viewCountText":{"simpleText":"([^"]+)"}/;
    const viewCountMatch = text.match(viewCountRegex);
    const viewCount = viewCountMatch ? viewCountMatch[1] : null;

    // latest video's published time
    const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"\}/;
    const publishedTimeMatch = text.match(publishedTimeRegex);
    const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : null;

    // description using the primary regex (supports escaped quotes)
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

    // external links & titles
    const externalLinkRegex = /"channelExternalLinkViewModel":\{"title":\{"content":"([^"]+)"\},"link":\{"content":"([^"]+)"/g;
    let externalLinks = [];
    let match;
    while ((match = externalLinkRegex.exec(text)) !== null) {
      externalLinks.push({
        title: match[1].trim(),
        link: match[2].trim(),
        icon: null
      });
    }

    // link icons
    const iconRegex = /"url":"([^"]+)","width":256,"height":256/g;
    let iconMatch;
    let icons = [];
    while ((iconMatch = iconRegex.exec(text)) !== null) {
      icons.push(iconMatch[1].trim());
    }
    // associate icons with external links by index
    for (let i = 0; i < externalLinks.length; i++) {
      externalLinks[i].icon = icons[i] || null;
    }
    if (externalLinks.length === 0) {
      externalLinks = null;
    }

    return {
      subscriberCount,
      country,
      joinedDate,
      videoCount,
      viewCount,
      publishedTime,
      description,
      links: externalLinks,
      hasDescription: !!description,
      hasLinks: !!(externalLinks && externalLinks.length > 0)
    };
  };

  /**
   * inserts the channel info into the comment element.
   * Info is arranged into three columns:
   *   - left: subscribers, country, joined date
   *   - middle: video count, latest video's view count & published time
   *   - right: description (with tooltip) and external links (dropdown popup)
   * container is inserted below the commenter's name and above the comment text
   * MutationObserver updates the info if the channel URL changes
   * @param {HTMLElement} commentElement -> the comment element to augment
   */
  const addChannelInfo = async (commentElement) => {
    const channelUrlLookup = 'div#header-author a';
    const headerElement = commentElement.querySelector('div#header-author');
    if (!headerElement) return;

    // remove any existing info container
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

    // left column: subscribers, country, joined date
    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '4px';
    const subBox = createInfoBox('👥', channelInfo.subscriberCount);
    const countryBox = createInfoBox('🌐', channelInfo.country);
    const joinedBox = createInfoBox('📅', channelInfo.joinedDate);
    if (subBox) leftColumn.appendChild(subBox);
    if (countryBox) leftColumn.appendChild(countryBox);
    if (joinedBox) leftColumn.appendChild(joinedBox);

    // middle column: video count, latest video's view count & published time
    const middleColumn = document.createElement('div');
    middleColumn.style.display = 'flex';
    middleColumn.style.flexDirection = 'column';
    middleColumn.style.gap = '4px';
    const videoBox = createInfoBox('🎥', channelInfo.videoCount);
    const viewBox = createInfoBox('👁️', channelInfo.viewCount);
    const publishedBox = createInfoBox('🕒', channelInfo.publishedTime);
    if (videoBox) middleColumn.appendChild(videoBox);
    if (viewBox) middleColumn.appendChild(viewBox);
    if (publishedBox) middleColumn.appendChild(publishedBox);

    // right column: description and external links
    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '4px';
    if (channelInfo.hasDescription) {
      const descBox = createInfoBox('📝');
      enableDescriptionHover(descBox, channelInfo.description);
      rightColumn.appendChild(descBox);
    }
    if (channelInfo.hasLinks && channelInfo.links && channelInfo.links.length > 0) {
      const linksBox = createLinkBox('🔗', null);
      linksBox.style.cursor = 'pointer';
      linksBox.addEventListener('click', (e) => {
        e.preventDefault();
        showExternalLinksPopup(channelInfo.links, linksBox);
      });
      rightColumn.appendChild(linksBox);
    }

    if (leftColumn.children.length > 0) infoContainer.appendChild(leftColumn);
    if (middleColumn.children.length > 0) infoContainer.appendChild(middleColumn);
    if (rightColumn.children.length > 0) infoContainer.appendChild(rightColumn);

    // insert the info container above the comment text
    const commentContent = commentElement.querySelector('#content-text');
    if (commentContent && commentContent.parentElement && infoContainer.children.length > 0) {
      commentContent.parentElement.insertBefore(infoContainer, commentContent);
    }

    // observer: update info if the channel URL changes
    const observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(async mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
          infoContainer.style.visibility = 'hidden';
          const updatedChannelUrl = commentElement.querySelector(channelUrlLookup).href;
          const updatedInfo = await getChannelInfo(updatedChannelUrl);
          leftColumn.innerHTML = '';
          middleColumn.innerHTML = '';
          rightColumn.innerHTML = '';

          const updatedSubBox = createInfoBox('👥', updatedInfo.subscriberCount);
          const updatedCountryBox = createInfoBox('🌐', updatedInfo.country);
          const updatedJoinedBox = createInfoBox('📅', updatedInfo.joinedDate);
          if (updatedSubBox) leftColumn.appendChild(updatedSubBox);
          if (updatedCountryBox) leftColumn.appendChild(updatedCountryBox);
          if (updatedJoinedBox) leftColumn.appendChild(updatedJoinedBox);

          const updatedVideoBox = createInfoBox('🎥', updatedInfo.videoCount);
          const updatedViewBox = createInfoBox('👁️', updatedInfo.viewCount);
          const updatedPublishedBox = createInfoBox('🕒', updatedInfo.publishedTime);
          if (updatedVideoBox) middleColumn.appendChild(updatedVideoBox);
          if (updatedViewBox) middleColumn.appendChild(updatedViewBox);
          if (updatedPublishedBox) middleColumn.appendChild(updatedPublishedBox);

          if (updatedInfo.hasDescription) {
            const updatedDescBox = createInfoBox('📝');
            enableDescriptionHover(updatedDescBox, updatedInfo.description);
            rightColumn.appendChild(updatedDescBox);
          }
          if (updatedInfo.hasLinks && updatedInfo.links && updatedInfo.links.length > 0) {
            const updatedLinksBox = createLinkBox('🔗', null);
            updatedLinksBox.style.cursor = 'pointer';
            updatedLinksBox.addEventListener('click', e => {
              e.preventDefault();
              showExternalLinksPopup(updatedInfo.links, updatedLinksBox);
            });
            rightColumn.appendChild(updatedLinksBox);
          }
          infoContainer.style.visibility = 'visible';
        }
      });
    });
    observer.observe(
      commentElement.querySelector(channelUrlLookup),
      { attributes: true }
    );
  };

  // OBSERVER FOR NEW COMMENTS //
  const commentObserver = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
      mutation.addedNodes.forEach(el => {
        if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
          addChannelInfo(el);
        }
      });
    });
  });

  // start observing for new comments
  commentObserver.observe(
    document.querySelector('ytd-app'),
    { childList: true, subtree: true }
  );
})();