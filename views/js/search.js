document.addEventListener('DOMContentLoaded', () => {
    const from = sessionStorage.getItem('fromLocation');
    const to = sessionStorage.getItem('toLocation');
    
    const searchResults = document.getElementById('searchResults');
    
    if (from && to) {
        // In a real application, this would fetch results from a server
        searchResults.innerHTML = `
            <h2>Buses from ${from} to ${to}</h2>
            <p>Showing sample results:</p>
            <ul>
                <li>Bus 1 - 9:00 AM</li>
                <li>Bus 2 - 11:00 AM</li>
                <li>Bus 3 - 2:00 PM</li>
            </ul>
        `;
    } else {
        searchResults.innerHTML = '<p>No search parameters found. Please return to the home page and try again.</p>';
    }
});