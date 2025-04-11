// 🚀 Handle Search Form Submission
function handleSearch(event) {
    event.preventDefault();
    
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    
    // Store the search parameters in sessionStorage
    sessionStorage.setItem('fromLocation', from);
    sessionStorage.setItem('toLocation', to);
    
    // Redirect to the search results page with query parameters
    window.location.href = `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}


