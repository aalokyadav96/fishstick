
function generateFeedHTML() {
    return `
        <div class="container">
            <main class="feed">
                <div class="post-compose">
                    <div class="post-header">
                        <select id="postType" class="post-type-selector">
                            <option value="text">Text Post</option>
                            <option value="image">Image Post</option>
                            <option value="video">Video Post</option>
                        </select>
                    </div>
                    <div id="mediaUpload" class="media-upload">
                        <input type="file" id="imageUpload" accept="image/*" multiple style="display: none;">
                        <input type="file" id="videoUpload" accept="video/*" style="display: none;">
                    </div>
                    <div id="mediaPreview" class="media-preview hflex" contenteditable="true"></div>
                    <button id="postButton" class="post-button">Post</button>
                </div>

                <section id="postsContainer" class="container"></section>
            </main>
        </div>
    `;
}

export {generateFeedHTML};