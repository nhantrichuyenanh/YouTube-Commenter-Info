(function() {
  'use strict';

  const error = 'Error';

  async function getChannelInfo(channelUrl) {

    if (channelUrl.startsWith('http://')) {
      channelUrl = channelUrl.replace('http://', 'https://');
    }

    const result = {
      subscribers: null,
      country: null,
      totalVideos: null,
      views: null,
      mostRecentUpload: null,
      joinedDate: null,
      desc: null,
      foundLinks: [],
      hasDescription: false,
      hasLinks: false
    };

    try {
      const aboutResp = await fetch(channelUrl + '/about');
      if (!aboutResp.ok) {
        console.warn(`Failed to fetch ${channelUrl}/about (${aboutResp.status})`);
      } else {
        const aboutText = await aboutResp.text();
        result.subscribers = parseSubscribers(aboutText);
        result.country = parseCountry(aboutText);
        result.totalVideos = parseTotalVideos(aboutText);
        result.views = parseViews(aboutText);
        result.joinedDate = parseJoinedDate(aboutText);
        const descValue = parseDescription(aboutText);
        if (descValue && descValue.length > 0) {
          result.hasDescription = true;
          result.desc = descValue;
        }
        const linkArray = parseLinks(aboutText);
        if (linkArray.length > 0) {
          result.hasLinks = true;
          result.foundLinks = linkArray;
        }
      }
    } catch (err) {
      console.error('Error fetching channel /about:', err);
    }

    try {
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

  // parse functions
  function parseSubscribers(text) {
    const m = text.match(/"subscriberCountText":"([^"]+)"/);
    return m ? m[1] : error;
  }

  function parseCountry(text) {
    const m = text.match(/"country":"([^"]+)"/);
    return m ? m[1] : error;
  }

  function parseTotalVideos(text) {
    const m = text.match(/"videoCountText":"([^"]+)"/);
    return m ? m[1] : error;
  }

  function parseViews(text) {
    const m = text.match(/"viewCountText":{"simpleText":"([^"]+)"}/);
    return m ? m[1] : error;
  }

  function parseMostRecentUpload(videosText) {
    const m = videosText.match(/"publishedTimeText":\{"simpleText":"([^"]+)"\}/);
    return m ? m[1] : error;
  }

  function parseJoinedDate(text) {
    const m = text.match(/"joinedDateText":\{"content":"([^"]+)"/);
    return m ? m[1].trim() : error;
  }

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

  function parseLinks(aboutText) {
    const re = /"link"\s*:\s*\{\s*[^{}]*?"content"\s*:\s*"([^"]+)"/g;
    let match;
    const found = [];
    while ((match = re.exec(aboutText)) !== null) {
      found.push(match[1].trim());
    }
    return found;
  }

  async function addCommentSubCount(commentElement) {

    const channelUrlLookup = 'div#header-author a';
    const commentHeaderElement = commentElement.querySelector('div#header-author');
    if (!commentHeaderElement) return;
    commentHeaderElement.querySelectorAll('.yt-enhanced-info').forEach(el => el.remove());
    const channelUrl = commentElement.querySelector(channelUrlLookup)?.href;
    if (!channelUrl) return;
    const channelInfo = await getChannelInfo(channelUrl);
    const hasData = Object.values(channelInfo).some(value => value !== null && value !== error && value !== null);
    if (!hasData) return;

    const infoContainer = document.createElement('div');
    infoContainer.className = 'yt-enhanced-info';
    infoContainer.style.display = 'flex';
    infoContainer.style.gap = '4px';
    infoContainer.style.marginTop = '4px';
    infoContainer.style.marginBottom = '8px';
    infoContainer.style.width = 'auto';
    infoContainer.style.maxWidth = '800px';

    const leftColumn = document.createElement('div');
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '4px';
    leftColumn.style.marginRight = '8px';

    const middleColumn = document.createElement('div');
    middleColumn.style.display = 'flex';
    middleColumn.style.flexDirection = 'column';
    middleColumn.style.gap = '4px';
    middleColumn.style.marginRight = '8px';

    const rightColumn = document.createElement('div');
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '4px';

    // leftColumn: subCounter, country, joined
    const subCounterSpan = createInfoBox(`👥 ${channelInfo.subscribers}`, channelInfo.subscribers);
    const countrySpan = createInfoBox(`🌐 ${channelInfo.country}`, channelInfo.country);
    const joinedSpan = createInfoBox(`📅 ${channelInfo.joinedDate}`, channelInfo.joinedDate);
    let hasLeftContent = false;
    if (subCounterSpan) { leftColumn.appendChild(subCounterSpan); hasLeftContent = true; }
    if (countrySpan) { leftColumn.appendChild(countrySpan); hasLeftContent = true; }
    if (joinedSpan) { leftColumn.appendChild(joinedSpan); hasLeftContent = true; }

    // middleColumnColumn: videos, views, upload
    const videosSpan = createInfoBox(`🎥 ${channelInfo.totalVideos}`, channelInfo.totalVideos);
    const viewsSpan = createInfoBox(`👁️ ${channelInfo.views}`, channelInfo.views);
    const uploadSpan = createInfoBox(`🕒 ${channelInfo.mostRecentUpload}`, channelInfo.mostRecentUpload);
    let hasMiddleContent = false;
    if (videosSpan) { middleColumn.appendChild(videosSpan); hasMiddleContent = true; }
    if (viewsSpan) { middleColumn.appendChild(viewsSpan); hasMiddleContent = true; }
    if (uploadSpan) { middleColumn.appendChild(uploadSpan); hasMiddleContent = true; }

    // rightColumn: desc, link
    let descSpan = null;
    if (channelInfo.hasDescription) {
      descSpan = createInfoBox('📝', 'someNonNull');
      enableDescriptionHover(descSpan, channelInfo.desc);
    }
    let linkSpan = null;
    if (channelInfo.hasLinks) {
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

    if (hasLeftContent) infoContainer.appendChild(leftColumn);
    if (hasMiddleContent) infoContainer.appendChild(middleColumn);
    if (hasRightContent) infoContainer.appendChild(rightColumn);
    if (infoContainer.children.length > 0) {
      const commentContent = commentElement.querySelector('#content-text');
      if (commentContent) {
        commentContent.parentElement.insertBefore(infoContainer, commentContent);
      }
    }

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
          updateInfoBox(subCounterSpan, `👥 ${updated.subscribers}`, updated.subscribers);
          updateInfoBox(countrySpan, `🌐 ${updated.country}`, updated.country);
          updateInfoBox(joinedSpan, `📅 ${updated.joinedDate}`, updated.joinedDate);
          updateInfoBox(videosSpan, `🎥 ${updated.totalVideos}`, updated.totalVideos);
          updateInfoBox(viewsSpan, `👁️ ${updated.views}`, updated.views);
          updateInfoBox(uploadSpan, `🕒 ${updated.mostRecentUpload}`, updated.mostRecentUpload);

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

          if (updated.hasLinks && !linkSpan) {
            linkSpan = createLinkBox('🔗', newChannelUrl + '/about');
            rightColumn.appendChild(linkSpan);
          } else if (!updated.hasLinks && linkSpan) {
            linkSpan.remove();
            linkSpan = null;
          } else if (updated.hasLinks && linkSpan) {
            linkSpan.href = newChannelUrl + '/about';
            linkSpan.style.display = 'block';
          }
        });
    });

    const channelLinkElement = commentElement.querySelector(channelUrlLookup);
    if (channelLinkElement) {
      mutationObserver.observe(channelLinkElement, { childList: false, subtree: false, attributes: true });
    }
  }

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

  function enableDescriptionHover(descSpan, descriptionText) {
    if (!descriptionText) return;
    descSpan.addEventListener('mouseenter', e => {
      const tooltip = createTooltip(descriptionText);
      document.body.appendChild(tooltip);
      positionTooltip(e, tooltip);
      tooltip.style.display = 'block';
      function onMouseMove(ev) {
        positionTooltip(ev, tooltip);
      }
      function onMouseLeave() {
        tooltip.remove();
        descSpan.removeEventListener('mousemove', onMouseMove);
        descSpan.removeEventListener('mouseleave', onMouseLeave);
      }
      descSpan.addEventListener('mousemove', onMouseMove);
      descSpan.addEventListener('mouseleave', onMouseLeave);
    });
  }

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
    tooltip.textContent = text.replace(/\\n/g, '\n');
    return tooltip;
  }

  function positionTooltip(e, tooltip) {
    const offset = 10;
    tooltip.style.left = (e.pageX + offset) + 'px';
    tooltip.style.top = (e.pageY + offset) + 'px';
  }

  function createLinkBox(iconText, aboutUrl) {
    if (!aboutUrl) return null;
    const link = document.createElement('a');
    link.className = 'yt-enhanced-info-item';
    link.textContent = iconText;
    link.href = aboutUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    styleInfoBox(link);
    return link;
  }

  function updateInfoBox(box, textValue, rawData) {
    if (!box) return;
    if (!rawData || rawData === 'unavailable' || rawData === null || rawData === error) {
      box.style.display = 'none';
    } else {
      box.textContent = textValue;
      box.style.display = 'block';
    }
  }

  function styleInfoBox(el) {
    el.style.background = 'var(--yt-spec-general-background-a, #fff)';
    el.style.color = 'var(--yt-spec-text-primary, #000)';
    el.style.padding = '4px 8px';
    el.style.borderRadius = '4px';
    el.style.border = '1px solid rgba(128, 128, 128, 0.2)';
    el.style.fontSize = '1rem';
    el.style.width = 'fit-content';
    el.style.position = 'relative';
  }

  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach(el => {
        if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
          addCommentSubCount(el);
        }
      });
    }
  });

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