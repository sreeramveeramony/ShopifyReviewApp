(function () {
    // Configuration
    const API_BASE_URL = 'https://4ad2118066df.ngrok-free.app'; // Change this to your actual server URL
    const CONTAINER_ID = 'shopify-review-widget';


    // Create the widget container if it doesn't exist
    function createWidgetContainer() {
        if (!document.getElementById(CONTAINER_ID)) {
            const container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.style.maxWidth = '1200px';
            container.style.margin = '2rem auto';
            container.style.padding = '1rem';
            container.style.fontFamily = 'sans-serif';

            // Try to find a good place to insert the widget
            const productForm = document.querySelector('form[action*="cart/add"]');
            if (productForm) {
                productForm.parentNode.insertBefore(container, productForm.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }
    }

    // Load approved reviews
    async function loadReviews() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/approved`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            const reviews = await response.json();

            const container = document.getElementById(CONTAINER_ID);
            if (!container) return;

            if (reviews.length === 0) {
                container.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
                return;
            }

            container.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h3 style="color: #333; margin-bottom: 1rem;">Customer Reviews</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                        ${reviews.map(review => `
                            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; background: #fff;">
                                <div style="margin-bottom: 1rem;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: #333;">${review.title}</h4>
                                    <div style="font-size: 1.2rem; color: #f39c12; margin-bottom: 0.5rem;">
                                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <p style="margin: 0 0 1rem 0; color: #666;">${review.review}</p>
                                <div style="border-top: 1px solid #eee; padding-top: 0.5rem;">
                                    <p style="margin: 0; font-weight: bold; color: #333;">${review.name}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <a href="${API_BASE_URL}/widget" target="_blank" 
                       style="display: inline-block; background: #3498db; color: white; padding: 0.5rem 1rem; 
                              text-decoration: none; border-radius: 4px; font-weight: 500;">
                        Write a Review
                    </a>
                </div>
            `;
        } catch (error) {
            console.error('Error loading reviews:', error);
            const container = document.getElementById(CONTAINER_ID);
            if (container) {
                container.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
            }
        }
    }

    // Initialize the widget
    function init() {
        createWidgetContainer();
        loadReviews();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();