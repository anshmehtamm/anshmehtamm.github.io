document.addEventListener('DOMContentLoaded', function() {
    // --- Script for LSTM News Classifier ---
    const newsInput = document.getElementById('news-input');
    const newsResultDiv = document.getElementById('news-result');
    const newsExplanationP = document.getElementById('news-explanation');
    let newsDebounceTimer;

    // Ensure elements exist before adding listeners
    if (newsInput && newsResultDiv && newsExplanationP) {
        newsInput.addEventListener('input', function() {
            const text = this.value.trim();
            const words = text.split(' ').filter(word => word.trim() !== '');
            if (words.length <= 3) {
                newsResultDiv.innerHTML = '';
                newsExplanationP.style.display = 'none';
                clearTimeout(newsDebounceTimer); // Clear timer if input becomes too short
                return;
            }
            clearTimeout(newsDebounceTimer);
            newsDebounceTimer = setTimeout(() => {
                fetchNewsClassification(text);
            }, 500);
        });

        newsInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const text = this.value.trim();
                const words = text.split(' ').filter(word => word.trim() !== '');
                if (words.length > 3) {
                    clearTimeout(newsDebounceTimer);
                    fetchNewsClassification(text);
                }
            }
        });
    } else {
        console.error("LSTM Classifier elements not found!");
    }


    function fetchNewsClassification(text) {
        if (!newsResultDiv || !newsExplanationP) return; // Guard clause
        newsResultDiv.innerHTML = '<span class="loading-message">Classifying...</span>';
        newsExplanationP.style.display = 'none';

        fetch('https://bkrv0f4amc.execute-api.us-east-1.amazonaws.com/news_classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: text })
        })
        .then(response => {
            if (!response.ok) {
                 return response.json().catch(() => ({})).then(errBody => {
                    throw new Error(`HTTP error! status: ${response.status}. ${errBody.message || ''}`);
                 });
            }
            return response.json();
        })
        .then(data => {
            if (data.category && data.title && data.colors && data.gradients) {
                displayNewsClassification(data.category, data.title, data.colors, data.gradients);
            } else {
                 console.warn('API response structure might be incorrect:', data);
                 throw new Error('Invalid response structure from API.');
            }
        })
        .catch(error => {
            console.error('Error fetching news classification:', error);
            if (newsResultDiv) {
                newsResultDiv.innerHTML = `<span class="error-message">Failed to classify: ${error.message}.</span>`;
            }
            if (newsExplanationP) {
                newsExplanationP.style.display = 'none';
            }
        });
    }

    function displayNewsClassification(category, titles, colors, gradients) {
        if (!newsResultDiv || !newsExplanationP) return; // Guard clause
        newsResultDiv.innerHTML = '';
        const categorySpan = document.createElement('span');
        categorySpan.textContent = 'Classification: ' + category;
        categorySpan.style.fontWeight = 'bold'; // Make category bold
        newsResultDiv.appendChild(categorySpan);
        newsResultDiv.appendChild(document.createElement('br'));

        const wordsContainer = document.createElement('div');
        wordsContainer.style.marginTop = '10px';

        titles.forEach((title, index) => {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'word-container';
            wordContainer.style.backgroundColor = colors[index] || '#888';
            wordContainer.textContent = title;

            const gradientSpan = document.createElement('span');
            gradientSpan.className = 'gradient-value';
            const gradientValue = typeof gradients[index] === 'number' ? gradients[index].toFixed(2) : 'N/A';
            gradientSpan.textContent = ' (' + gradientValue + ')';
            wordContainer.appendChild(gradientSpan);

            wordsContainer.appendChild(wordContainer);
        });

        newsResultDiv.appendChild(wordsContainer);
        newsExplanationP.style.display = 'block';
    }

    // --- Script for Semantic Product Search (MODAL IMPLEMENTATION) ---
    const searchInput = document.getElementById('product-search-input');
    const searchButton = document.getElementById('product-search-button');
    const modal = document.getElementById('search-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const modalResultsDiv = document.getElementById('modal-product-search-results'); // Target modal's results div
    const modalQueryDisplay = document.getElementById('modal-query-display');

    // *** Check if all modal elements were found ***
    if (!searchInput || !searchButton || !modal || !modalBackdrop || !modalCloseButton || !modalResultsDiv || !modalQueryDisplay) {
        console.error("One or more semantic search/modal elements were not found in the DOM!");
        // Optionally disable the search button or provide user feedback
        if (searchButton) searchButton.disabled = true;
        return; // Stop executing the rest of the modal script if elements are missing
    }

    // Function to show the modal
    function showModal() {
        modalBackdrop.style.display = "block";
        modal.style.display = "flex"; // Use flex to enable centering defined in CSS
    }

    // Function to hide the modal
    function hideModal() {
        modal.style.display = "none";
        modalBackdrop.style.display = "none";
    }

    // Function to trigger search and display in modal
    function performProductSearch() {
        const query = searchInput.value.trim();

        if (!query) {
            alert("Please enter a search query.");
            return;
        }

        // *** Re-check modalResultsDiv just in case (though DOMContentLoaded should prevent this) ***
        if (!modalResultsDiv) {
             console.error("modalResultsDiv is null inside performProductSearch - DOM issue?");
             return;
        }

        // Show modal and loading state
        modalQueryDisplay.textContent = query; // Show the query in the modal
        modalResultsDiv.innerHTML = '<p class="loading-message">Searching for products...</p>'; // << This is the line that likely caused the error (now protected by DOMContentLoaded)
        showModal();

        const apiUrl = 'https://bkrv0f4amc.execute-api.us-east-1.amazonaws.com/semantic-product-search';

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: query })
        })
        .then(response => {
            if (!response.ok) {
                 return response.json().catch(() => ({})).then(errBody => {
                    throw new Error(`HTTP error! status: ${response.status}. ${errBody.message || 'Check API logs.'}`);
                 });
            }
            return response.json();
        })
        .then(data => {
            const products = data.product_details;
            console.log("Received products:", products);

            if (Array.isArray(products) && products.length > 0) {
                displayProductResultsInModal(products); // Use the modal display function
            } else if (Array.isArray(products) && products.length === 0) {
                modalResultsDiv.innerHTML = '<p>No products found matching your query.</p>';
            } else {
                console.error('Invalid data format received, expected product_details array:', data);
                modalResultsDiv.innerHTML = '<p class="error-message">Received unexpected data format from the server.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching product search results:', error);
            // Check modalResultsDiv again before setting innerHTML in catch block
             if (modalResultsDiv) {
                modalResultsDiv.innerHTML = `<p class="error-message">Failed to fetch results: ${error.message}. Please try again later.</p>`;
             }
        });
    }

    // Function to display results in the MODAL
    function displayProductResultsInModal(products) {
         // *** Re-check modalResultsDiv ***
        if (!modalResultsDiv) {
             console.error("modalResultsDiv is null inside displayProductResultsInModal - DOM issue?");
             return;
        }
        // Clear previous results or loading message from modal
        modalResultsDiv.innerHTML = '';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        const headers = ['Product Title', 'Brand', 'Description']; // Adjust order/names based on API
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Populate table body with product data (limited number for display)
        products.slice(0, 10).forEach(product => { // Show top 10 results in modal
            const row = document.createElement('tr');

            const title = product.product_title || 'N/A';
            const brand = product.product_brand || 'N/A';
            const description = product.product_description || 'N/A';

            [title, brand, description].forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        modalResultsDiv.appendChild(table); // Append table to the modal's results div
    }


    // --- Event Listeners for Modal ---

    // Listener for search button click
    searchButton.addEventListener('click', performProductSearch);

    // Listener for Enter key on search input
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performProductSearch();
        }
    });

    // Listener for modal close button
    modalCloseButton.addEventListener('click', hideModal);

    // Listener for clicks outside the modal content (on the backdrop)
    modalBackdrop.addEventListener('click', function(event) {
        if (event.target === modalBackdrop) {
           hideModal();
        }
    });

    // Optional: Close modal with the Escape key
    document.addEventListener('keydown', function(event) {
        // Check if modal exists and is currently displayed
        if (modal && modal.style.display === "flex" && event.key === "Escape") {
            hideModal();
        }
    });

}); // End of DOMContentLoaded listener