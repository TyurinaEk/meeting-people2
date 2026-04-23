    const API_KEY_2GIS = 'b4df16ae-910f-4511-bff0-994e9f96d004'; 
    // Инициализация карты 
    const map = L.map('map').setView([51.6608, 39.2003], 13);
    

    L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&key=' + API_KEY_2GIS, {
        subdomains: '1234',
        attribution: '© 2GIS',
        maxZoom: 19
    }).addTo(map);
// хранение данных
    let events = [];
    let userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('userId', userId);

    function loadEvents() {
        const saved = localStorage.getItem('events');
        if (saved) {
            events = JSON.parse(saved);
        } else {
            events = [
                { id: '1', lat: 51.6608, lng: 39.2003, address: "Набережная, Воронеж", description: 'Пробежка в 18:00', createdAt: Date.now(), userId: userId },
                { id: '2', lat: 51.6700, lng: 39.2100, address: "Спорткомплекс, ул. Плехановская", description: 'Баскетбол, ждём игроков', createdAt: Date.now() - 100000, userId: 'other' }
            ];
            saveEvents();
        }
        render();
    }

    function saveEvents() {
        localStorage.setItem('events', JSON.stringify(events));
    }

    function addEvent(lat, lng, address, desc) {
        events.push({
            id: Date.now().toString(),
            lat, lng, address,
            description: desc,
            createdAt: Date.now(),
            userId: userId
        });
        saveEvents();
        render();
    }

    function deleteEvent(id) {
        const ev = events.find(e => e.id === id);
        if (ev && ev.userId === userId) {
            events = events.filter(e => e.id !== id);
            saveEvents();
            render();
        } else {
            alert("Нельзя удалить чужое мероприятие");
        }
    }

    function editEvent(id, newDesc) {
        const ev = events.find(e => e.id === id);
        if (ev && ev.userId === userId) {
            ev.description = newDesc;
            ev.createdAt = Date.now();
            saveEvents();
            render();
        } else {
            alert("Нельзя редактировать чужое мероприятие");
        }
    }

// отображение маркеров
    let markersLayer = L.layerGroup().addTo(map);
    let markerMap = new Map();

    function renderMarkers() {
        markersLayer.clearLayers();
        markerMap.clear();
        events.forEach(ev => {
            const marker = L.marker([ev.lat, ev.lng]).addTo(markersLayer);
            const popupContent = `
                <b>${escapeHtml(ev.description)}</b><br>
                ${escapeHtml(ev.address)}<br>
                <small>${new Date(ev.createdAt).toLocaleString()}</small>
            `;
            marker.bindPopup(popupContent);
            marker.eventId = ev.id;
            markerMap.set(ev.id, marker);
        });
    }
// отображенее списка
    function renderList() {
        const container = document.getElementById('eventsList');
        if (!events.length) {
            container.innerHTML = '<div style="padding:20px;text-align:center;">Нет встреч. Нажми на карту ➕</div>';
            return;
        }
        const sorted = [...events].sort((a,b) => b.createdAt - a.createdAt);
        container.innerHTML = sorted.map(ev => `
            <div class="event-item" data-id="${ev.id}">
                <div class="event-address">📍 ${escapeHtml(ev.address)}</div>
                <div class="event-desc">${escapeHtml(ev.description)}</div>
                <div class="event-meta">${new Date(ev.createdAt).toLocaleString()}</div>
                ${ev.userId === userId ? `
                    <div class="event-actions">
                        <button class="edit-btn" data-id="${ev.id}">✏️</button>
                        <button class="delete-btn" data-id="${ev.id}">❌</button>
                    </div>
                ` : '<div class="event-meta" style="margin-top:5px;">🔒 Чужое</div>'}
            </div>
        `).join('');

        // приближаемся по клику на запись
        document.querySelectorAll('.event-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-btn') || e.target.classList.contains('delete-btn')) return;
                const id = el.dataset.id;
                const ev = events.find(e => e.id === id);
                if (ev) {
                    map.flyTo([ev.lat, ev.lng], 15, { duration: 1 });
                    const marker = markerMap.get(id);
                    if (marker) marker.openPopup();
                }
            });
        });

        // Обработчики кнопок редактирования/удаления
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const ev = events.find(e => e.id === id);
                const newDesc = prompt('Новое описание:', ev.description);
                if (newDesc) editEvent(id, newDesc);
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Удалить?')) deleteEvent(btn.dataset.id);
            });
        });
    }

    function render() {
        renderMarkers();
        renderList();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
// добавление по клику на карте
    let tempMarker = null;
    let selectedLat = null, selectedLng = null;

    map.on('click', (e) => {
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = L.marker([selectedLat, selectedLng]).addTo(map)
            .bindPopup('Новое место').openPopup();
        document.getElementById('addForm').style.display = 'flex';
        document.getElementById('addressInput').value = '';
        document.getElementById('activityText').value = '';
    });

    document.getElementById('cancelBtn').onclick = () => {
        document.getElementById('addForm').style.display = 'none';
        if (tempMarker) map.removeLayer(tempMarker);
        selectedLat = null;
        selectedLng = null;
    };

    document.getElementById('submitBtn').onclick = () => {
        const desc = document.getElementById('activityText').value.trim();
        let addr = document.getElementById('addressInput').value.trim();
        if (!desc) { alert('Опишите занятие'); return; }
        if (selectedLat === null || selectedLng === null) { alert('Сначала выберите место на карте'); return; }
        if (!addr) addr = `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
        addEvent(selectedLat, selectedLng, addr, desc);
        document.getElementById('addForm').style.display = 'none';
        if (tempMarker) map.removeLayer(tempMarker);
        selectedLat = null;
        selectedLng = null;
    };


    loadEvents();