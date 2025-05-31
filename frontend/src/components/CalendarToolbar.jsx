import React from 'react';

const CalendarToolbar = (toolbar) => {
    return (
        <div className="rbc-toolbar flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="rbc-btn-group flex gap-2">
                <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>
                Today
                </button>
                <button type="button" onClick={() => toolbar.onNavigate('PREV')} aria-label="Back">
                <span role="img" aria-label="Back" style={{ fontSize: '1.2em' }}>←</span>
                </button>
                <button type="button" onClick={() => toolbar.onNavigate('NEXT')} aria-label="Next">
                <span role="img" aria-label="Next" style={{ fontSize: '1.2em' }}>→</span>
                </button>
            </div>
            <span className="rbc-toolbar-label text-lg font-bold text-gray-800 text-center">{toolbar.label}</span>
            <div className="rbc-btn-group flex gap-2">
                {toolbar.views.map(view => (
                <button
                    type="button"
                    key={view}
                    className={view === toolbar.view ? 'rbc-active' : ''}
                    onClick={() => toolbar.onView(view)}
                >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
                ))}
            </div>
        </div>
    );
};

export default CalendarToolbar; 