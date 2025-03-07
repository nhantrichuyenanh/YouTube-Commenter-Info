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
    /**
     * tooltip
     * @param {string} text -> tooltip text
     * @returns {HTMLElement} -> tooltip
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
        // making sure if someone has their description set as Q&A: "blah blah blah" it displayes as that
        // instead of Q&A: \
        tooltip.textContent = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        return tooltip;
    }

    /**
     * tooltip positioning
     * @param {MouseEvent} e -> mouse event
     * @param {HTMLElement} tooltip -> tooltip positioning
     */
    function positionTooltip(e, tooltip) {
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY + 10) + 'px';
    }

    /**
     * info box styling
     * @param {HTMLElement} el -> styling
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
     * info box
     * @param {string} icon -> emoji
     * @param {string} text -> text
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
     * @param {string} text -> text
     * @returns {HTMLElement} -> info box
     */
    function createSimpleBox(text) {
        const box = document.createElement('div');
        styleInfoBox(box);
        box.textContent = text;
        return box;
    }

    /**
     * tooltip hover
     * @param {HTMLElement} element
     * @param {string} descriptionText
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
     * link box
     * @param {string} iconText -> emoji
     * @param {string|null} aboutUrl -> URL
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
     * link box dropdown
     * @param {Array} links
     * @param {HTMLElement} anchorEl
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
        popup.style.display = 'table';
        popup.style.borderSpacing = GAP;

        // iterate through each link and create table row elements
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
            leftColumn.style.fontSize = FONT_SIZE;
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

            // right column: URL
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

        // adjust column widths to be consistent across all rows
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

        // remove any pre-existing popup before adding new one
        const existingPopup = document.querySelector('.yt-enhanced-info-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        document.body.appendChild(popup);

        // position the popup relative to the anchor element
        const rect = anchorEl.getBoundingClientRect();
        popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';

        // remove popup when clicking outside of it
        function onClickOutside(e) {
            if (!popup.contains(e.target) && e.target !== anchorEl) {
                popup.remove();
                document.removeEventListener('click', onClickOutside);
            }
        }
        document.addEventListener('click', onClickOutside);
    }

    /**
     * /about fetcher
     * @param {string} channelUrl
     * @returns {Object}
     */
    const getChannelInfo = async (channelUrl) => {
        const response = await fetch(channelUrl + '/about');
        const text = await response.text();

        // sub count, total views, join date
        const hugeRegex = /"subscriberCountText":"([^"]+)","viewCountText":"([^"]+)","joinedDateText":\{"content":"([^"]+)"/;
        let subscriberCount, viewCount, joinedDate;
        const hugeMatch = text.match(hugeRegex);
        if (hugeMatch) {
            subscriberCount = hugeMatch[1];
            viewCount = hugeMatch[2];
            joinedDate = hugeMatch[3];
        } else {
            // fallback extraction
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

        // country
        const countryRegex = /"country":"([^"]+)"/;
        const countryMatch = text.match(countryRegex);
        const country = countryMatch ? countryMatch[1] : null;

        // total videos
        const videoCountRegex = /"videoCountText":"([^"]+)"/;
        const videoCountMatch = text.match(videoCountRegex);
        const videoCount = videoCountMatch ? videoCountMatch[1] : null;

        // description
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

        // external links
        const externalLinkRegex = /"channelExternalLinkViewModel":\{"title":\{"content":"([^"]+)"\},"link":\{"content":"([^"]+)"/g;
        let externalLinks = [];
        let match;
        while ((match = externalLinkRegex.exec(text)) !== null) {
            externalLinks.push({ title: match[1].trim(), link: match[2].trim(), icon: null });
        }

        // external links icons
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

        // business email
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
     * /video fetcher
     * @param {string} channelUrl
     * @returns {Object}
     */
    const getLatestVideoInfo = async (channelUrl) => {
        const response = await fetch(channelUrl + '/videos');
        const text = await response.text();

        // title
        const titleRegex = /"title":\{"runs":\[\{"text":"([^"]+)"/;
        const titleMatch = text.match(titleRegex);
        const title = titleMatch ? titleMatch[1] : 'N/A';

        // published time
        const publishedTimeRegex = /"publishedTimeText":\{"simpleText":"([^"]+)"\}/;
        const publishedTimeMatch = text.match(publishedTimeRegex);
        const publishedTime = publishedTimeMatch ? publishedTimeMatch[1] : 'N/A';

        // length and view count
        const lengthViewRegex = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]+"\}\},"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"\}/;
        const lengthViewMatch = text.match(lengthViewRegex);
        const lengthText = lengthViewMatch ? lengthViewMatch[1] : 'N/A';
        const videoViewCount = lengthViewMatch ? lengthViewMatch[2] : 'N/A';

        // URL
        const linkRegex = /{"content":{"videoRenderer":{"videoId":"([^"]+)"/;
        const linkMatch = text.match(linkRegex);
        const videoId = linkMatch ? linkMatch[1] : null;

        // thumbnail
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
     * @param {string} channelUrl
     * @returns {HTMLElement}
     */
    function createLatestVideoBox(latestVideoInfo, channelUrl) {
        const box = document.createElement('div');
        box.className = 'yt-enhanced-info-item';
        box.textContent = '🎥' + latestVideoInfo.publishedTime;
        styleInfoBox(box);
        box.style.cursor = 'pointer';
        box.addEventListener('click', (e) => {
            e.preventDefault();
            showLatestVideoPopup(latestVideoInfo, box);
        });
        return box;
    }

    /**
     * latest video dropdown
     * @param {Object} videoInfo
     * @param {HTMLElement} anchorEl
     */
    function showLatestVideoPopup(videoInfo, anchorEl) {
        const existingPopup = document.querySelector('.yt-enhanced-latest-video-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        const popup = document.createElement('div');
        popup.className = 'yt-enhanced-latest-video-popup';
        popup.style.position = 'absolute';
        popup.style.background = GENERAL_BACKGROUND;
        popup.style.color = TEXT_COLOR;
        popup.style.padding = '4px';
        popup.style.border = BORDER_STYLE;
        popup.style.borderRadius = BORDER_RADIUS;
        popup.style.boxShadow = BOX_SHADOW;
        popup.style.zIndex = POPUP_ZINDEX;
        popup.style.display = 'flex';
        popup.style.flexDirection = 'column';
        popup.style.gap = GAP;

        /**
         * latest video dropdown helper functions
         * @param {string} text
         * @returns {HTMLElement}
         */
        function createInfoCell(text) {
            const cell = document.createElement('div');
            cell.style.flex = '1';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.padding = PADDING;
            cell.style.border = BORDER_STYLE;
            cell.style.borderRadius = BORDER_RADIUS;
            cell.style.fontSize = FONT_SIZE;
            cell.textContent = text;
            return cell;
        }

        // top row: views and length
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.gap = GAP;
        const viewsCell = createInfoCell(videoInfo.videoViewCount);
        const lengthCell = createInfoCell(videoInfo.length);
        topRow.appendChild(viewsCell);
        topRow.appendChild(lengthCell);

        // middle row: thumbnail
        const middleRow = document.createElement('div');
        middleRow.style.display = 'flex';
        middleRow.style.justifyContent = 'center';
        middleRow.style.alignItems = 'center';
        if (videoInfo.thumbnail) {
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = videoInfo.thumbnail;
            thumbnailImg.style.borderRadius = BORDER_RADIUS;
            thumbnailImg.style.border = BORDER_STYLE;
            thumbnailImg.style.maxWidth = '150px';
            thumbnailImg.style.height = 'auto';
            thumbnailImg.style.cursor = 'pointer';
            thumbnailImg.addEventListener('click', () => {
                if (videoInfo.videoId) {
                    window.open('https://www.youtube.com/watch?v=' + videoInfo.videoId, '_blank');
                }
            });
            thumbnailImg.addEventListener('load', () => {
                popup.style.width = thumbnailImg.offsetWidth + 'px';
            });
            middleRow.appendChild(thumbnailImg);
        }

        // bottom row: title
        const bottomRow = document.createElement('div');
        bottomRow.style.padding = PADDING;
        bottomRow.style.border = BORDER_STYLE;
        bottomRow.style.borderRadius = BORDER_RADIUS;
        bottomRow.style.fontSize = FONT_SIZE;
        bottomRow.style.whiteSpace = 'normal';
        bottomRow.style.wordBreak = 'break-word';
        bottomRow.textContent = videoInfo.title;

        popup.appendChild(topRow);
        popup.appendChild(middleRow);
        popup.appendChild(bottomRow);

        const rect = anchorEl.getBoundingClientRect();
        popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';

        document.body.appendChild(popup);

        function onClickOutside(e) {
            if (!popup.contains(e.target) && e.target !== anchorEl) {
                popup.remove();
                document.removeEventListener('click', onClickOutside);
            }
        }
        document.addEventListener('click', onClickOutside);
    }

    /**
     * @param {HTMLElement} commentElement
     */
    const addChannelInfo = async (commentElement) => {
        const channelUrlLookup = 'div#header-author a';
        const headerElement = commentElement.querySelector('div#header-author');
        if (!headerElement) return;

        // remove any previous info container to prevent duplication
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

        // left column: subscriber count, country, and join date
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

        // middle column: total videos, total views, and latest video (if available)
        const middleColumn = document.createElement('div');
        middleColumn.style.display = 'flex';
        middleColumn.style.flexDirection = 'column';
        middleColumn.style.gap = '4px';
        const videoBox = createInfoBox('🎥', channelInfo.videoCount);
        const viewBox = createInfoBox('👁️', channelInfo.viewCount);
        if (videoBox) middleColumn.appendChild(videoBox);
        if (viewBox) middleColumn.appendChild(viewBox);

        // fetch latest video information
        let latestVideoInfo = await getLatestVideoInfo(channelUrl);
        if (latestVideoInfo && latestVideoInfo.title !== 'N/A' &&
            latestVideoInfo.publishedTime !== 'N/A' &&
            latestVideoInfo.length !== 'N/A' &&
            latestVideoInfo.videoViewCount !== 'N/A') {
            const latestVideoBox = createLatestVideoBox(latestVideoInfo, channelUrl);
            middleColumn.appendChild(latestVideoBox);
        }

        // right column: hoverable description and external links (and business email if available)
        const rightColumn = document.createElement('div');
        rightColumn.style.display = 'flex';
        rightColumn.style.flexDirection = 'column';
        rightColumn.style.gap = '4px';
        if (channelInfo.hasDescription) {
            const descBox = createInfoBox('📝', ' ');
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
        if (channelInfo.hasBusinessEmail && channelInfo.businessEmail) {
            const emailBox = createLinkBox('📧', channelInfo.businessEmail);
            emailBox.style.cursor = 'pointer';
            rightColumn.appendChild(emailBox);
        }

        if (leftColumn.children.length > 0) infoContainer.appendChild(leftColumn);
        if (middleColumn.children.length > 0) infoContainer.appendChild(middleColumn);
        if (rightColumn.children.length > 0) infoContainer.appendChild(rightColumn);

        // below commenter's user handle and above the comment content
        const commentContent = commentElement.querySelector('#content-text');
        if (commentContent && commentContent.parentElement && infoContainer.children.length > 0) {
            commentContent.parentElement.insertBefore(infoContainer, commentContent);
        }

        // MutationObserver to listen for changes in the channel URL
        // when user sets comment section to Newest or First
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(async mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                    infoContainer.style.visibility = 'hidden';
                    const updatedChannelUrl = commentElement.querySelector(channelUrlLookup).href;
                    const updatedInfo = await getChannelInfo(updatedChannelUrl);
                    leftColumn.innerHTML = '';
                    middleColumn.innerHTML = '';
                    rightColumn.innerHTML = '';

                    // left column
                    const updatedSubBox = createInfoBox('👥', updatedInfo.subscriberCount);
                    const updatedCountryBox = createInfoBox('🌐', updatedInfo.country);
                    const updatedJoinedBox = createInfoBox('📅', updatedInfo.joinedDate);
                    if (updatedSubBox) leftColumn.appendChild(updatedSubBox);
                    if (updatedCountryBox) leftColumn.appendChild(updatedCountryBox);
                    if (updatedJoinedBox) leftColumn.appendChild(updatedJoinedBox);

                    // middle column
                    const updatedVideoBox = createInfoBox('🎥', updatedInfo.videoCount);
                    const updatedViewBox = createInfoBox('👁️', updatedInfo.viewCount);
                    if (updatedVideoBox) middleColumn.appendChild(updatedVideoBox);
                    if (updatedViewBox) middleColumn.appendChild(updatedViewBox);

                    let updatedLatestVideoInfo = await getLatestVideoInfo(updatedChannelUrl);
                    if (updatedLatestVideoInfo && updatedLatestVideoInfo.title !== 'N/A' &&
                        updatedLatestVideoInfo.publishedTime !== 'N/A' &&
                        updatedLatestVideoInfo.length !== 'N/A' &&
                        updatedLatestVideoInfo.videoViewCount !== 'N/A') {
                        const updatedLatestVideoBox = createLatestVideoBox(updatedLatestVideoInfo, updatedChannelUrl);
                        middleColumn.appendChild(updatedLatestVideoBox);
                    }

                    // right column
                    if (updatedInfo.hasDescription) {
                        const updatedDescBox = createInfoBox('📝', ' ');
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

                    if (updatedInfo.hasBusinessEmail && updatedInfo.businessEmail) {
                        const updatedEmailBox = createLinkBox('📧', updatedInfo.businessEmail);
                        updatedEmailBox.style.cursor = 'pointer';
                        rightColumn.appendChild(updatedEmailBox);
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

    // observer for new comments
    const commentObserver = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(el => {
                if (el.tagName === 'YTD-COMMENT-VIEW-MODEL') {
                    addChannelInfo(el);
                }
            });
        });
    });

    // start observing
    commentObserver.observe(
        document.querySelector('ytd-app'),
        { childList: true, subtree: true }
    );
})();