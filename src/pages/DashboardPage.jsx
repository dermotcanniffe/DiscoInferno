// src/pages/DashboardPage.jsx
import React from 'react';
import MapListComponent from '../components/MapListComponent'; // Adjust path

function DashboardPage() {
    return (
        <div style={{ padding: '20px' }}> {/* Add page-level padding/layout here */}
            <h2>Your Example Maps</h2>
            <MapListComponent /> {/* Render the reusable list component */}
        </div>
    );
}

export default DashboardPage;
