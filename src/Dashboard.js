import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const navigate = useNavigate();

  // --- STATE FOR EXHIBITS ---
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [beaconId, setBeaconId] = useState('');
  const [exhibits, setExhibits] = useState([]);
  
  // --- NEW: STATE FOR GALLERIES ---
  const [galleryName, setGalleryName] = useState('');
  const [galleryCity, setGalleryCity] = useState('');
  const [galleries, setGalleries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. Fetch Data (Exhibits AND Galleries) ---
  useEffect(() => {
    // Fetch Exhibits
    const unsubExhibits = onSnapshot(collection(db, 'exhibits'), (snapshot) => {
      setExhibits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Galleries
    const unsubGalleries = onSnapshot(collection(db, 'galleries'), (snapshot) => {
      setGalleries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubExhibits();
      unsubGalleries();
    };
  }, []);

  // --- 2. Create Exhibit ---
  const handleCreateExhibit = async (e) => {
    e.preventDefault();
    if (!title || !artist || !beaconId) return;
    try {
      await addDoc(collection(db, 'exhibits'), {
        title, artist, description, beaconId
      });
      setTitle(''); setArtist(''); setDescription(''); setBeaconId('');
    } catch (err) { setError(err.message); }
  };

  // --- 3. NEW: Create Gallery ---
  const handleCreateGallery = async (e) => {
    e.preventDefault();
    if (!galleryName || !galleryCity) return;
    try {
      await addDoc(collection(db, 'galleries'), {
        name: galleryName,
        city: galleryCity,
      });
      setGalleryName(''); setGalleryCity('');
    } catch (err) { setError(err.message); }
  };

  // --- Helpers ---
  const handleDelete = async (collectionName, id) => {
    if (window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </nav>

      <main className="dashboard-main" style={{display:'flex', flexDirection:'column', gap:'40px'}}>
        
        {/* --- SECTION 1: MANAGE GALLERIES (LOCATOR) --- */}
        <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
            <div className="form-card" style={{borderColor: '#28a745', borderWidth: '2px', borderStyle:'solid'}}>
            <h2 style={{color: '#28a745'}}>Add Gallery Location</h2>
            <form onSubmit={handleCreateGallery}>
                <div className="form-group">
                <label>Gallery Name</label>
                <input type="text" value={galleryName} onChange={e => setGalleryName(e.target.value)} required />
                </div>
                <div className="form-group">
                <label>City/Location</label>
                <input type="text" value={galleryCity} onChange={e => setGalleryCity(e.target.value)} required />
                </div>
                <button type="submit" className="login-button" style={{backgroundColor: '#28a745'}}>Add Gallery</button>
            </form>
            </div>

            <div className="list-card">
            <h2>Gallery Network</h2>
            <ul className="exhibit-list">
                {galleries.map(g => (
                <li key={g.id} className="exhibit-item">
                    <div className="exhibit-info">
                    <strong>{g.name}</strong>
                    <span>{g.city}</span>
                    </div>
                    <button onClick={() => handleDelete('galleries', g.id)} className="delete-button">Delete</button>
                </li>
                ))}
            </ul>
            </div>
        </div>

        <hr style={{width:'100%', border:'1px solid #ddd'}} />

        {/* --- SECTION 2: MANAGE EXHIBITS (CONTENT) --- */}
        <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
            <div className="form-card">
            <h2>Add Exhibit Content</h2>
            <form onSubmit={handleCreateExhibit}>
                <div className="form-group">
                <label>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                <label>Artist</label>
                <input type="text" value={artist} onChange={e => setArtist(e.target.value)} required />
                </div>
                <div className="form-group">
                <label>Beacon ID</label>
                <input type="text" value={beaconId} onChange={e => setBeaconId(e.target.value)} placeholder="1_1" required />
                </div>
                <div className="form-group">
                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <button type="submit" className="login-button">Add Exhibit</button>
            </form>
            </div>

            <div className="list-card">
            <h2>Exhibit Content</h2>
            <ul className="exhibit-list">
                {exhibits.map(ex => (
                <li key={ex.id} className="exhibit-item">
                    <div className="exhibit-info">
                    <strong>{ex.title}</strong>
                    <span>{ex.artist} (ID: {ex.beaconId})</span>
                    </div>
                    <button onClick={() => handleDelete('exhibits', ex.id)} className="delete-button">Delete</button>
                </li>
                ))}
            </ul>
            </div>
        </div>

      </main>
    </div>
  );
}

export default DashboardPage;