(function() {
  'use strict';
  console.log('YouTube™ Ultimate Comment Section Enhancer');

  const unavailable = null;
  const error = 'Error';

  const getChannelInfo = async (channelUrl) => {
    if (channelUrl.startsWith('http://')) {
      channelUrl = channelUrl.replace('http://', 'https://');
    }

    const result = {
      subscribers:     unavailable,
      country:         unavailable,
      totalVideos:     unavailable,
      views:           unavailable,
      mostRecentUpload:unavailable
    };

    try {
      const aboutResp = await fetch(channelUrl + '/about');
      if (!aboutResp.ok) {
        console.warn(`Failed to fetch ${channelUrl}/about (${aboutResp.status})`);
      } else {
        const aboutText = await aboutResp.text();
        result.subscribers  = parseSubscribers(aboutText);
        result.country      = parseCountry(aboutText);
        result.totalVideos  = parseTotalVideos(aboutText);
        result.views        = parseViews(aboutText);
      }
    } catch (err) {
      console.error("Error fetching channel /about:", err);
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
      console.error("Error fetching channel /videos:", err);
    }

    return result;
  };

  const parseSubscribers = (text) => {
    const m = text.match(/"subscriberCountText":"([^"]+)"/);
    return m ? m[1] : error;
  };
  const parseCountry = (text) => {
    const m = text.match(/"country":"([^"]+)"/);
    return m ? m[1] : error;
  };
  const parseTotalVideos = (text) => {
    const m = text.match(/"videoCountText":"([^"]+)"/);
    return m ? m[1] : error;
  };
  const parseViews = (text) => {
    const m = text.match(/"viewCountText":{"simpleText":"([^"]+)"}/);
    return m ? m[1] : error;
  };
  const parseMostRecentUpload = (videosText) => {
    const m = videosText.match(/"publishedTimeText":\{"simpleText":"([^"]+)"\}/);
    return m ? m[1] : error;
  };

  const addCommentSubCount = async (commentElement) => {
    const channelUrlLookup = 'div#header-author a';
    const commentHeaderElement = commentElement.querySelector('div#header-author');
    if (!commentHeaderElement) return;

    commentHeaderElement.querySelectorAll('.yt-enhanced-info').forEach(el => el.remove());

    const channelUrl = commentElement.querySelector(channelUrlLookup)?.href;
    if (!channelUrl) return;

    const channelInfo = await getChannelInfo(channelUrl);

    const hasData = Object.values(channelInfo).some(value =>
      value !== unavailable && value !== error && value !== null
    );
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

    const subCounterSpan = createInfoBox(`👥 ${channelInfo.subscribers}`, channelInfo.subscribers);
    const countrySpan    = createInfoBox(`🌐 ${channelInfo.country}`, channelInfo.country);
    const videosSpan     = createInfoBox(`🎥 ${channelInfo.totalVideos}`, channelInfo.totalVideos);
    const viewsSpan      = createInfoBox(`👁️ ${channelInfo.views}`, channelInfo.views);
    const uploadSpan     = createInfoBox(`🕒 ${channelInfo.mostRecentUpload}`, channelInfo.mostRecentUpload);

    let hasLeftContent = false;
    let hasMiddleContent = false;
    let hasRightContent = false;

    // left: sub + country
    if (subCounterSpan) { leftColumn.appendChild(subCounterSpan); hasLeftContent = true; }
    if (countrySpan)     { leftColumn.appendChild(countrySpan);   hasLeftContent = true; }

    // middle: videos + views + last upload
    if (videosSpan) { middleColumn.appendChild(videosSpan); hasMiddleContent = true; }
    if (viewsSpan)  { middleColumn.appendChild(viewsSpan);  hasMiddleContent = true; }
    if (uploadSpan) { middleColumn.appendChild(uploadSpan); hasMiddleContent = true; }

    // right: (remains empty for TODO)

    if (hasLeftContent)   infoContainer.appendChild(leftColumn);
    if (hasMiddleContent) infoContainer.appendChild(middleColumn);
    if (hasRightContent)  infoContainer.appendChild(rightColumn);

    if (infoContainer.children.length > 0) {
      const commentContent = commentElement.querySelector('#content-text');
      if (commentContent) {
        commentContent.parentElement.insertBefore(infoContainer, commentContent);
      }
    }

    const mutationObserver = new MutationObserver(mutationsList => {
      mutationsList
        .filter(mutation => mutation.type === 'attributes' && mutation.attributeName === 'href')
        .forEach(async () => {
          const newChannelUrl = commentElement.querySelector(channelUrlLookup).href;
          const updated = await getChannelInfo(newChannelUrl);

          const hasUpdatedData = Object.values(updated).some(value =>
            value !== unavailable && value !== error && value !== null
          );
          if (!hasUpdatedData) {
            infoContainer.remove();
            return;
          }

          updateInfoBox(subCounterSpan, `👥 ${updated.subscribers}`, updated.subscribers);
          updateInfoBox(countrySpan, `🌐 ${updated.country}`, updated.country);
          updateInfoBox(videosSpan, `🎥 ${updated.totalVideos}`, updated.totalVideos);
          updateInfoBox(viewsSpan, `👁️ ${updated.views}`, updated.views);
          updateInfoBox(uploadSpan, `🕒 ${updated.mostRecentUpload}`, updated.mostRecentUpload);
        });
    });

    const channelLinkElement = commentElement.querySelector(channelUrlLookup);
    if (channelLinkElement) {
      mutationObserver.observe(channelLinkElement, { childList: false, subtree: false, attributes: true });
    }
  };

  function createInfoBox(textValue, rawData) {
    if (!rawData || rawData === 'unavailable' || rawData === unavailable || rawData === error) {
      return null;
    }
    const box = document.createElement('div');
    box.className = 'yt-enhanced-info-item';
    box.textContent = textValue;
    styleInfoBox(box);
    return box;
  }

  function updateInfoBox(box, textValue, rawData) {
    if (!rawData || rawData === 'unavailable' || rawData === unavailable || rawData === error) {
      box.style.display = 'none';
    } else {
      box.textContent = textValue;
      box.style.display = 'block';
    }
  }

  function styleInfoBox(el) {
    el.style.background = 'var(--yt-spec-general-background-a, #181818)';
    el.style.color = 'var(--yt-spec-text-primary, #f1f1f1)';
    el.style.padding = '4px 8px';
    el.style.borderRadius = '4px';
    el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    el.style.fontSize = '0.9rem';
    el.style.width = 'fit-content';
  }

  const observer = new MutationObserver((mutationsList) => {
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
        console.error('Still no ytd-app found. Script may not function properly.');
      }
    }, 2000);
  }
})();