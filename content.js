(function() {
  'use strict';

  // parsing or data fetching error
  const error = 'Error';

  /**
   * fetches channel information from the channel's about and videos pages
   * @param {string} channelUrl -> the URL of the YouTube channel
   * @returns {object} -> object containing channel details
   */
  async function getChannelInfo(channelUrl) {
    // ensure the channel URL uses HTTPS
    if (channelUrl.startsWith('http://')) {
      channelUrl = channelUrl.replace('http://', 'https://');
    }

    // initialize result object with default values
    const result = {
      subscribers: null,
      country: null,
      totalVideos: null,
      views: null,
      mostRecentUpload: null,
      joinedDate: null,
      desc: null,
      foundLinks: [],
      externalLinks: [],
      hasDescription: false,
      hasLinks: false
    };

    try {
      // fetch the channel's about page
      const aboutResp = await fetch(channelUrl + '/about');
      if (!aboutResp.ok) {
        console.warn(`Failed to fetch ${channelUrl}/about (${aboutResp.status})`);
      } else {
        const aboutText = await aboutResp.text();
        // parse various pieces of channel data
        result.subscribers = parseSubscribers(aboutText);
        result.country = parseCountry(aboutText);
        result.totalVideos = parseTotalVideos(aboutText);
        result.views = parseViews(aboutText);
        result.joinedDate = parseJoinedDate(aboutText);

        // parse the channel description
        const descValue = parseDescription(aboutText);
        if (descValue && descValue.length > 0) {
          result.hasDescription = true;
          result.desc = descValue;
        }

        // parse any links found on the about page
        const linkArray = parseLinks(aboutText);
        if (linkArray.length > 0) {
          result.hasLinks = true;
          result.foundLinks = linkArray;
        }

        // parse external link details (e.g. URL, title, icon)
        const externalLinks = parseExternalLinkDetails(aboutText);
        if (externalLinks.length > 0 && externalLinks.some(item => item.link)) {
          result.externalLinks = externalLinks;
          result.hasLinks = true;
        }
      }
    } catch (err) {
      console.error('Error fetching channel /about:', err);
    }

    try {
      // fetch the channel's videos page to obtain the most recent upload info
      const videosResp = await fetch(channelUrl + '/videos');
      if (!videosResp.ok) {
        console.warn(`Failed to fetch ${channelUrl}/videos (${videosResp.status})`);
      } else {
        const videosText = await videosResp.text();
        result.mostRecentUpload = parseMostRecentUpload(videosText);
      }
    } catch (err) {
      console.error('Error fetching channel /videos:', err);
    }
    return result;
  }

  // parsing functions
  // subscriber count using a regular expression.
  function parseSubscribers(text) {
    const m = text.match(/"subscriberCountText":"([^"]+)"/);
    return m ? m[1] : error;
  }

  // country
  function parseCountry(text) {
    const m = text.match(/"country":"([^"]+)"/);
    return m ? m[1] : error;
  }

  // total number of videos
  function parseTotalVideos(text) {
    const m = text.match(/"videoCountText":"([^"]+)"/);
    return m ? m[1] : error;
  }

  // latest video's view count
  function parseViews(text) {
    const m = text.match(/"viewCountText":{"simpleText":"([^"]+)"}/);
    return m ? m[1] : error;
  }

  // latest video's upload time
  function parseMostRecentUpload(videosText) {
    const m = videosText.match(/"publishedTimeText":\{"simpleText":"([^"]+)"\}/);
    return m ? m[1] : error;
  }

  // creation date
  function parseJoinedDate(text) {
    const m = text.match(/"joinedDateText":\{"content":"([^"]+)"/);
    return m ? m[1].trim() : error;
  }

  // description
  function parseDescription(aboutText) {
    let m = aboutText.match(/"description":"([^"]*)"/);
    if (m) {
      const descValue = m[1].trim();
      return descValue.length > 0 ? descValue : null;
    }
    m = aboutText.match(/"description":\{"descriptionPreviewViewModel":\{"description":\{"content":"([^"]*)"/);
    if (m) {
      const descValue = m[1].trim();
      return descValue.length > 0 ? descValue : null;
    }
    return null;
  }

  // extracts basic link strings found on the about page
  function parseLinks(aboutText) {
    const re = /"link"\s*:\s*\{\s*[^{}]*?"content"\s*:\s*"([^"]+)"/g;
    let match;
    const found = [];
    while ((match = re.exec(aboutText)) !== null) {
      found.push(match[1].trim());
    }
    return found;
  }

  /**
   * extracts external link details including URL, title, and icon
   * @param {string} text -> the HTML/text from the about page
   * @returns {Array} -> array of link detail objects
   */
  function parseExternalLinkDetails(text) {
    const linkRe = /"link"\s*:\s*\{\s*[^{}]*?"content"\s*:\s*"([^"]+)"/g;
    const titleRe = /"channelExternalLinkViewModel":\{"title":\{"simpleText":"([^"]+)"\}/g;
    const iconRe = /"url":"([^"]+)","width":256,"height":256/g;

    let links = [];
    let match;
    while ((match = linkRe.exec(text)) !== null) {
      links.push(match[1].trim());
    }

    let titles = [];
    while ((match = titleRe.exec(text)) !== null) {
      titles.push(match[1].trim());
    }

    let icons = [];
    while ((match = iconRe.exec(text)) !== null) {
      icons.push(match[1].trim());
    }

    let results = [];
    // ensure iterating through the maximum count found
    const count = Math.max(links.length, titles.length, icons.length);
    for (let i = 0; i < count; i++) {
      results.push({
        link: links[i] || '',
        title: titles[i] || '',
        icon: icons[i] || ''
      });
    }
    return results;
  }

  /**
   * enhances a YouTube comment element by adding a channel info boxes
   * @param {HTMLElement} commentElement -> the comment element to enhance
   */
  async function addCommentSubCount(commentElement) {
    // selector for the channel link in the comment header
    const channelUrlLookup = 'div#header-author a';
    const commentHeaderElement = commentElement.querySelector('div#header-author');
    if (!commentHeaderElement) return;

    // remove any previously added info boxes
    commentHeaderElement.querySelectorAll('.yt-enhanced-info').forEach(el => el.remove());

    // get the channel URL from the comment
    const channelUrl = commentElement.querySelector(channelUrlLookup)?.href;
    if (!channelUrl) return;

    // fetch the channel information
    const channelInfo = await getChannelInfo(channelUrl);
    const hasData = Object.values(channelInfo).some(value => value !== null && value !== error && value !== null);
    if (!hasData) return;

    // create a container to hold the enhanced info
    const infoContainer = document.createElement('div');
    infoContainer.className = 'yt-enhanced-info';
    infoContainer.style.display = 'flex';
    infoContainer.style.gap = '4px';
    infoContainer.style.marginTop = '4px';
    infoContainer.style.marginBottom = '8px';
    infoContainer.style.width = 'auto';
    infoContainer.style.maxWidth = '800px';

    // left column: subscribers, country, joined date
    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '4px';
    leftColumn.style.marginRight = '8px';

    // middle column: total videos, views, most recent upload
    const middleColumn = document.createElement('div');
    middleColumn.style.display = 'flex';
    middleColumn.style.flexDirection = 'column';
    middleColumn.style.gap = '4px';
    middleColumn.style.marginRight = '8px';

    // right column: description and external links
    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '4px';

    // create info boxes for each data point
    const subCounterSpan = createInfoBox(`👥 ${channelInfo.subscribers}`, channelInfo.subscribers);
    const countrySpan = createInfoBox(`🌐 ${channelInfo.country}`, channelInfo.country);
    const joinedSpan = createInfoBox(`📅 ${channelInfo.joinedDate}`, channelInfo.joinedDate);
    let hasLeftContent = false;
    if (subCounterSpan) { leftColumn.appendChild(subCounterSpan); hasLeftContent = true; }
    if (countrySpan) { leftColumn.appendChild(countrySpan); hasLeftContent = true; }
    if (joinedSpan) { leftColumn.appendChild(joinedSpan); hasLeftContent = true; }

    const videosSpan = createInfoBox(`🎥 ${channelInfo.totalVideos}`, channelInfo.totalVideos);
    const viewsSpan = createInfoBox(`👁️ ${channelInfo.views}`, channelInfo.views);
    const uploadSpan = createInfoBox(`🕒 ${channelInfo.mostRecentUpload}`, channelInfo.mostRecentUpload);
    let hasMiddleContent = false;
    if (videosSpan) { middleColumn.appendChild(videosSpan); hasMiddleContent = true; }
    if (viewsSpan) { middleColumn.appendChild(viewsSpan); hasMiddleContent = true; }
    if (uploadSpan) { middleColumn.appendChild(uploadSpan); hasMiddleContent = true; }

    // create a description box with a hover tooltip if description exists
    let descSpan = null;
    if (channelInfo.hasDescription) {
      descSpan = createInfoBox('📝', 'someNonNull');
      enableDescriptionHover(descSpan, channelInfo.desc);
    }

    // create a link box that shows external links in a popup, or links to the about page
    let linkSpan = null;
    if (channelInfo.hasLinks && channelInfo.externalLinks && channelInfo.externalLinks.length > 0) {
      linkSpan = createLinkBox('🔗', null);
      linkSpan.style.cursor = 'pointer';
      linkSpan.addEventListener('click', e => {
        e.preventDefault();
        showExternalLinksPopup(channelInfo.externalLinks, linkSpan);
      });
    } else if (channelInfo.hasLinks) {
      linkSpan = createLinkBox('🔗', channelUrl + '/about');
    }

    let hasRightContent = false;
    if (descSpan) {
      rightColumn.appendChild(descSpan);
      hasRightContent = true;
    }
    if (linkSpan) {
      rightColumn.appendChild(linkSpan);
      hasRightContent = true;
    }

    // append columns with content to the info container
    if (hasLeftContent) infoContainer.appendChild(leftColumn);
    if (hasMiddleContent) infoContainer.appendChild(middleColumn);
    if (hasRightContent) infoContainer.appendChild(rightColumn);

    // insert the info container into the comment before the text
    if (infoContainer.children.length > 0) {
      const commentContent = commentElement.querySelector('#content-text');
      if (commentContent) {
        commentContent.parentElement.insertBefore(infoContainer, commentContent);
      }
    }

    // observe changes to the channel link (if the user clicks a different channel) and update info
    const mutationObserver = new MutationObserver(mutationsList => {
      mutationsList
        .filter(m => m.type === 'attributes' && m.attributeName === 'href')
        .forEach(async () => {
          const newChannelUrl = commentElement.querySelector(channelUrlLookup).href;
          const updated = await getChannelInfo(newChannelUrl);
          const hasUpdatedData = Object.values(updated).some(value => value !== null && value !== error && value !== null);
          if (!hasUpdatedData) {
            infoContainer.remove();
            return;
          }

          // update each info box with new data
          updateInfoBox(subCounterSpan, `👥 ${updated.subscribers}`, updated.subscribers);
          updateInfoBox(countrySpan, `🌐 ${updated.country}`, updated.country);
          updateInfoBox(joinedSpan, `📅 ${updated.joinedDate}`, updated.joinedDate);
          updateInfoBox(videosSpan, `🎥 ${updated.totalVideos}`, updated.totalVideos);
          updateInfoBox(viewsSpan, `👁️ ${updated.views}`, updated.views);
          updateInfoBox(uploadSpan, `🕒 ${updated.mostRecentUpload}`, updated.mostRecentUpload);

          // update or add description info
          if (updated.hasDescription && !descSpan) {
            descSpan = createInfoBox('📝', 'someNonNull');
            enableDescriptionHover(descSpan, updated.desc);
            rightColumn.appendChild(descSpan);
          } else if (!updated.hasDescription && descSpan) {
            descSpan.remove();
            descSpan = null;
          } else if (updated.hasDescription && descSpan) {
            descSpan.style.display = 'block';
            enableDescriptionHover(descSpan, updated.desc);
          }

          // update or add external links
          if (updated.hasLinks && updated.externalLinks && updated.externalLinks.length > 0) {
            if (!linkSpan) {
              linkSpan = createLinkBox('🔗', null);
              linkSpan.style.cursor = 'pointer';
              rightColumn.appendChild(linkSpan);
              linkSpan.addEventListener('click', e => {
                e.preventDefault();
                showExternalLinksPopup(updated.externalLinks, linkSpan);
              });
            } else {
              linkSpan.style.display = 'block';
              linkSpan.onclick = function(e) {
                e.preventDefault();
                showExternalLinksPopup(updated.externalLinks, linkSpan);
              };
            }
          } else if (updated.hasLinks) {
            if (!linkSpan) {
              linkSpan = createLinkBox('🔗', newChannelUrl + '/about');
              rightColumn.appendChild(linkSpan);
            } else {
              linkSpan.href = newChannelUrl + '/about';
              linkSpan.style.display = 'block';
            }
          } else if (!updated.hasLinks && linkSpan) {
            linkSpan.remove();
            linkSpan = null;
          }
        });
    });

    // begin observing changes on the channel link element
    const channelLinkElement = commentElement.querySelector(channelUrlLookup);
    if (channelLinkElement) {
      mutationObserver.observe(channelLinkElement, { childList: false, subtree: false, attributes: true });
    }
  }

  /**
   * creates an info box element to display channel data
   * @param {string} textValue -> the text to display
   * @param {any} rawData -> the underlying data; if invalid, no box is created
   * @returns {HTMLElement|null} -> the created info box or null
   */
  function createInfoBox(textValue, rawData) {
    if (!rawData || rawData === 'unavailable' || rawData === null || rawData === error) {
      return null;
    }
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = textValue;
    styleInfoBox(box);
    return box;
  }

  /**
   * adds a hover tooltip to description box
   * @param {HTMLElement} descSpan -> the description info box
   * @param {string} descriptionText -> the full description text to show in the tooltip
   */
  function enableDescriptionHover(descSpan, descriptionText) {
    if (!descriptionText) return;
    descSpan.addEventListener('mouseenter', e => {
      const tooltip = createTooltip(descriptionText);
      document.body.appendChild(tooltip);
      positionTooltip(e, tooltip);
      tooltip.style.display = 'block';
      // update tooltip position as the mouse moves
      function onMouseMove(ev) {
        positionTooltip(ev, tooltip);
      }
      // remove tooltip when the mouse leaves
      function onMouseLeave() {
        tooltip.remove();
        descSpan.removeEventListener('mousemove', onMouseMove);
        descSpan.removeEventListener('mouseleave', onMouseLeave);
      }
      descSpan.addEventListener('mousemove', onMouseMove);
      descSpan.addEventListener('mouseleave', onMouseLeave);
    });
  }

  /**
   * creates a tooltip element with specified text
   * @param {string} text -> the text to show in the tooltip
   * @returns {HTMLElement} -> the tooltip element
   */
  function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.style.background = 'var(--yt-spec-general-background-a, #fff)';
    tooltip.style.color = 'var(--yt-spec-text-primary, #000)';
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.border = '1px solid rgba(128, 128, 128, 0.2)';
    tooltip.style.fontSize = '1rem';
    tooltip.style.position = 'absolute';
    tooltip.style.whiteSpace = 'pre-wrap';
    tooltip.style.zIndex = '999999';
    tooltip.style.display = 'none';
    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    // replace escape sequences with actual characters
    let fixedText = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    tooltip.textContent = fixedText;
    return tooltip;
  }

  /**
   * positions the tooltip relative to the mouse event
   * @param {MouseEvent} e -> the mouse event
   * @param {HTMLElement} tooltip -> the tooltip element
   */
  function positionTooltip(e, tooltip) {
    const offset = 10;
    tooltip.style.left = (e.pageX + offset) + 'px';
    tooltip.style.top = (e.pageY + offset) + 'px';
  }

  /**
   * creates a link box element that displays an icon/text and links to URL
   * @param {string} iconText -> the text or icon to display
   * @param {string|null} aboutUrl -> the URL for the link
   * @returns {HTMLElement|null} -> the link element or null if URL is invalid
   */
  function createLinkBox(iconText, aboutUrl) {
    if (!aboutUrl && aboutUrl !== null) return null;
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
   * displays a popup containing external links
   * the popup styles link text in blue and hides the "https://www." prefix
   * @param {Array} links -> array of external link objects
   * @param {HTMLElement} anchorEl -> the element the popup is anchored to
   */
  function showExternalLinksPopup(links, anchorEl) {
    let popup = document.createElement('div');
    popup.className = 'yt-enhanced-info-popup';
    popup.style.position = 'absolute';
    popup.style.background = 'var(--yt-spec-general-background-a, #fff)';
    popup.style.color = 'var(--yt-spec-text-primary, #000)';
    popup.style.padding = '8px';
    popup.style.border = '1px solid rgba(128,128,128,0.2)';
    popup.style.borderRadius = '4px';
    popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    popup.style.zIndex = '1000000';

    // iterate over each external link
    links.forEach(item => {
      if (!item.link) return;

      // ensure link has a protocol; if missing, prepend "https://www."
      if (!/^https?:\/\//i.test(item.link)) {
        item.link = 'https://www.' + item.link.replace(/^www\./i, '');
      }

      const linkItem = document.createElement('a');
      linkItem.href = item.link;
      linkItem.target = '_blank';
      linkItem.rel = 'noopener noreferrer';
      linkItem.style.display = 'flex';
      linkItem.style.alignItems = 'center';
      linkItem.style.gap = '4px';
      linkItem.style.marginBottom = '4px';
      linkItem.style.textDecoration = 'none';
      linkItem.style.padding = '4px 8px';
      linkItem.style.border = '1px solid rgba(128,128,128,0.2)';
      linkItem.style.borderRadius = '4px';
      linkItem.style.color = "#3ea2f7"; // dark blue looks unsightly tbh

      if (item.icon) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.style.width = '16px';
        img.style.height = '16px';
        linkItem.appendChild(img);
      }
      const titleSpan = document.createElement('span');
      // remove the "https://www." prefix from the displayed text
      let displayText = item.title || item.link;
      displayText = displayText.replace(/^https:\/\/www\./, '');
      titleSpan.textContent = displayText;
      titleSpan.style.color = "#3ea2f7";
      linkItem.appendChild(titleSpan);
      popup.appendChild(linkItem);
    });

    // remove any existing popup before adding the new one
    const existingPopup = document.querySelector('.yt-enhanced-info-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    document.body.appendChild(popup);

    // position the popup just below the anchor element
    const rect = anchorEl.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    popup.style.left = (rect.left + window.scrollX) + 'px';

    // dismiss the popup if clicking outside of it
    function onClickOutside(e) {
      if (!popup.contains(e.target) && e.target !== anchorEl) {
        popup.remove();
        document.removeEventListener('click', onClickOutside);
      }
    }
    setTimeout(() => {
      document.addEventListener('click', onClickOutside);
    }, 0);
  }

  /**
   * updates an existing info box with new data
   * @param {HTMLElement} box -> the info box element
   * @param {string} textValue -> the updated text value
   * @param {any} rawData -> the new underlying data
   */
  function updateInfoBox(box, textValue, rawData) {
    if (!box) return;
    if (!rawData || rawData === 'unavailable' || rawData === null || rawData === error) {
      box.style.display = 'none';
    } else {
      box.textContent = textValue;
      box.style.display = 'block';
    }
  }

  /**
   * applies CSS styles to info boxes
   * @param {HTMLElement} el -> the element to style
   */
  function styleInfoBox(el) {
    el.style.background = 'var(--yt-spec-general-background-a, #fff)';
    el.style.color = 'var(--yt-spec-text-primary, #000)';
    el.style.padding = '4px 8px';
    el.style.borderRadius = '4px';
    el.style.border = '1px solid rgba(128,128,128,0.2)';
    el.style.fontSize = '1rem';
    el.style.width = 'fit-content';
    el.style.position = 'relative';
  }

   // MutationObserver to detect new comment nodes
   // observe for new YTD-COMMENT-VIEW-MODEL elements (comments) added to the page
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach(el => {
        if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
          addCommentSubCount(el);
        }
      });
    }
  });

  // start observing the main YouTube app element
  const commentsSection = document.querySelector('ytd-app');
  if (commentsSection) {
    observer.observe(commentsSection, { childList: true, subtree: true });
  } else {
    console.warn('ytd-app not found initially, retrying...');
    setTimeout(() => {
      const delayed = document.querySelector('ytd-app');
      if (delayed) {
        observer.observe(delayed, { childList: true, subtree: true });
      } else {
        console.error('still no ytd-app found, script may not function properly!');
      }
    }, 2000);
  }
})();