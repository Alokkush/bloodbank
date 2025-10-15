// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBReWV18Bd7pOTS-Q7hdoO71QKFtznShtA",
  authDomain: "blood-bank-system-9fd0a.firebaseapp.com",
  projectId: "blood-bank-system-9fd0a",
  storageBucket: "blood-bank-system-9fd0a.firebasestorage.app",
  messagingSenderId: "676039880020",
  appId: "1:676039880020:web:53202f4e2657a249cd2cc1",
  measurementId: "G-VX4GP1M2H6"
};

// Initialize Firebase using the CDN approach
// Note: Make sure to include Firebase SDK scripts in your HTML
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global variables
let currentUser = null;
let currentPage = 'login';

// Page routing
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(page + '-page').style.display = 'block';
  currentPage = page;
  
  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`[onclick="showPage('${page}')"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Load page data
  loadPageData(page);
}

// Authentication
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    
    // Check admin privileges after login
    await checkAdminPrivileges();
  } catch (error) {
    showAlert('Login failed: ' + error.message, 'danger');
    console.error('Login error:', error);
  }
}

async function checkAdminPrivileges() {
  try {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    console.log('🔍 Checking admin privileges...');
    console.log('Email:', currentUser.email);
    console.log('UID:', currentUser.uid);
    console.log('Auth state:', currentUser.emailVerified ? 'Verified' : 'Not verified');
    
    // Add small delay to ensure Firestore connection is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ✅ FIXED: Use UID instead of email as document ID
    console.log('📄 Fetching user document...');
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    
    console.log('Document exists:', userDoc.exists);
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('📊 User document data:', userData);
      console.log('👤 User role:', userData.role);
      console.log('📧 Stored email:', userData.email);
      
      if (userData.role === 'admin') {
        console.log('✅ Admin access granted');
        showAlert('Welcome Admin! Dashboard loading...', 'success');
        showAdminPanel();
      } else {
        throw new Error(`Access denied. User role is "${userData.role}", expected "admin"`);
      }
    } else {
      throw new Error(`❌ User document not found! Create a document in users collection with ID: ${currentUser.uid}`);
    }
    
  } catch (error) {
    console.error('❌ Admin privilege check failed:', error);
    
    // Show specific error message
    if (error.message.includes('not found')) {
      showAlert('Setup Error: Admin user document missing in Firestore. Check console for details.', 'warning');
    } else if (error.code === 'permission-denied') {
      showAlert('Permission Error: Firestore security rules blocking access.', 'danger');
    } else {
      showAlert('Error loading dashboard: Missing or insufficient permissions.', 'danger');
    }
    
    // Log helpful setup instructions
    console.log('🔧 SETUP INSTRUCTIONS:');
    console.log('1. Go to Firebase Console → Firestore Database');
    console.log('2. Go to "users" collection');
    console.log(`3. Create document with ID: ${currentUser?.uid || '[USER_UID]'}`);
    console.log('4. Add fields: email: "admin@bloodbank.com", role: "admin"');
    console.log('5. Make sure Firestore rules allow read access to users collection');
    
    // Don't auto sign out, let user see the error
    setTimeout(() => {
      if (confirm('Would you like to sign out and try again?')) {
        auth.signOut();
      }
    }, 5000);
  }
}

async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    showLoginPage();
  } catch (error) {
    showAlert('Logout failed: ' + error.message, 'danger');
  }
}

// Auth state observer
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await checkAdminPrivileges();
  } else {
    currentUser = null;
    showLoginPage();
  }
});

// UI Functions
function showLoginPage() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('public-portal').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('public-portal').style.display = 'none';
  showPage('dashboard');
}

function showPublicPortal() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('public-portal').style.display = 'block';
}

// Alert function
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const container = document.querySelector('.container') || document.body;
  container.insertBefore(alertDiv, container.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Load page data
async function loadPageData(page) {
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'donors':
      loadDonors();
      break;
    case 'donations':
      loadDonations();
      break;
    case 'requests':
      loadRequests();
      break;
    case 'handover':
      loadHandover();
      break;
    case 'inventory':
      loadInventory();
      break;
  }
}

// Dashboard functions
async function loadDashboard() {
  try {
    console.log('Loading dashboard data...');
    
    // Update last updated timestamp
    const now = new Date();
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = now.toLocaleTimeString();
    }
    
    // Load statistics
    const donorsSnapshot = await db.collection('donors').get();
    const donationsSnapshot = await db.collection('donations').get();
    const requestsSnapshot = await db.collection('requests').get();
    const handoverSnapshot = await db.collection('handover').get();
    
    // Calculate statistics
    const totalDonors = donorsSnapshot.size;
    
    let totalUnits = 0;
    let thisWeekUnits = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    donationsSnapshot.forEach(doc => {
      const donation = doc.data();
      totalUnits += donation.units || 0;
      
      // Check if donation was this week
      if (donation.createdAt && donation.createdAt.seconds) {
        const donationDate = new Date(donation.createdAt.seconds * 1000);
        if (donationDate >= oneWeekAgo) {
          thisWeekUnits += donation.units || 0;
        }
      }
    });
    
    // Pending requests
    let pendingRequests = 0;
    let urgentRequests = 0;
    requestsSnapshot.forEach(doc => {
      const request = doc.data();
      if (request.status === 'Pending') {
        pendingRequests++;
        // Consider requests older than 3 days as urgent
        if (request.createdAt && request.createdAt.seconds) {
          const requestDate = new Date(request.createdAt.seconds * 1000);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          if (requestDate <= threeDaysAgo) {
            urgentRequests++;
          }
        }
      }
    });
    
    // Calculate growth indicators
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    let donorsLastMonth = 0;
    donorsSnapshot.forEach(doc => {
      const donor = doc.data();
      if (donor.createdAt && donor.createdAt.seconds) {
        const donorDate = new Date(donor.createdAt.seconds * 1000);
        if (donorDate >= oneMonthAgo) {
          donorsLastMonth++;
        }
      }
    });
    
    // Update UI elements
    document.getElementById('total-donors').textContent = totalDonors;
    document.getElementById('total-donations').textContent = totalUnits;
    document.getElementById('pending-requests').textContent = pendingRequests;
    document.getElementById('urgent-requests').textContent = urgentRequests;
    document.getElementById('donors-growth').textContent = `+${donorsLastMonth}`;
    document.getElementById('donations-growth').textContent = `+${thisWeekUnits}`;
    
    // Load inventory data for stock count
    await loadInventoryForDashboard();
    
    // Load charts
    loadDashboardCharts();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load stock status
    loadStockStatus();
    
    console.log('Dashboard loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showAlert('Error loading dashboard: ' + error.message, 'danger');
  }
}

// Donors functions
async function loadDonors() {
  try {
    console.log('Loading donors...');
    const querySnapshot = await db.collection('donors').orderBy('createdAt', 'desc').get();
    const tbody = document.querySelector('#donors-table tbody');
    
    if (!tbody) {
      console.error('Donors table not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No donors found</td></tr>';
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const donor = doc.data();
      const row = document.createElement('tr');
      const createdDate = donor.createdAt ? new Date(donor.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
      
      row.innerHTML = `
        <td>${doc.id.substring(0, 8)}...</td>
        <td>${donor.name || 'N/A'}</td>
        <td><span class="badge bg-primary">${donor.bloodGroup || 'N/A'}</span></td>
        <td>${donor.age || 'N/A'}</td>
        <td>${donor.contact || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editDonor('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDonor('${doc.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    console.log(`Loaded ${querySnapshot.size} donors`);
  } catch (error) {
    console.error('Error loading donors:', error);
    showAlert('Error loading donors: ' + error.message, 'danger');
    
    // Show empty state on error
    const tbody = document.querySelector('#donors-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading donors</td></tr>';
    }
  }
}

async function addDonor() {
  const form = document.getElementById('donor-form');
  if (!form) {
    showAlert('Donor form not found', 'danger');
    return;
  }
  
  const formData = new FormData(form);
  
  // Validate required fields
  const name = formData.get('name')?.trim();
  const bloodGroup = formData.get('bloodGroup');
  const age = parseInt(formData.get('age'));
  const contact = formData.get('contact')?.trim();
  
  if (!name || !bloodGroup || !age || !contact) {
    showAlert('Please fill in all required fields', 'warning');
    return;
  }
  
  const donorData = {
    name: name,
    bloodGroup: bloodGroup,
    age: age,
    gender: formData.get('gender') || 'Male',
    contact: contact,
    address: formData.get('address')?.trim() || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    source: 'admin'
  };
  
  try {
    // Check if this is an edit operation
    const editId = form.dataset.editId;
    
    if (editId) {
      // Update existing donor
      console.log('Updating donor:', editId, donorData);
      await db.collection('donors').doc(editId).update({
        ...donorData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showAlert('Donor updated successfully', 'success');
    } else {
      // Add new donor
      console.log('Adding new donor:', donorData);
      const docRef = await db.collection('donors').add(donorData);
      console.log('Donor added with ID:', docRef.id);
      
      showAlert('Donor added successfully', 'success');
    }
    
    // Reset form and modal
    form.reset();
    delete form.dataset.editId;
    
    // Reset modal title and button
    const modalTitle = document.querySelector('#donorModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Donor';
    
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Donor';
    
    closeDonorModal();
    
    // Reload donors list
    setTimeout(() => {
      loadDonors();
    }, 500);
    
  } catch (error) {
    console.error('Error saving donor:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your admin privileges.', 'danger');
    } else {
      showAlert('Error saving donor: ' + error.message, 'danger');
    }
  }
}

// Public functions
async function registerPublicDonor() {
  const form = document.getElementById('public-donor-form');
  const formData = new FormData(form);
  
  const donor = {
    name: formData.get('name'),
    bloodGroup: formData.get('bloodGroup'),
    age: parseInt(formData.get('age')),
    gender: formData.get('gender'),
    contact: formData.get('contact'),
    email: formData.get('email'),
    address: formData.get('address'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    source: 'public'
  };
  
  try {
    await db.collection('donors').add(donor);
    showAlert('Thank you for registering as a donor!');
    form.reset();
  } catch (error) {
    showAlert('Error registering: ' + error.message, 'danger');
  }
}

async function addRequest() {
  const form = document.getElementById('request-form');
  if (!form) {
    showAlert('Request form not found', 'danger');
    return;
  }
  
  const formData = new FormData(form);
  
  // Validate required fields
  const patientName = formData.get('patientName')?.trim();
  const bloodGroup = formData.get('bloodGroup');
  const hospital = formData.get('hospital')?.trim();
  const contact = formData.get('contact')?.trim();
  const units = parseInt(formData.get('units'));
  
  if (!patientName || !bloodGroup || !hospital || !contact || !units) {
    showAlert('Please fill in all required fields', 'warning');
    return;
  }
  
  const request = {
    patientName: patientName,
    bloodGroup: bloodGroup,
    hospital: hospital,
    contact: contact,
    units: units,
    status: formData.get('status') || 'Pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    source: 'admin'
  };
  
  try {
    // Check if this is an edit operation
    const editId = form.dataset.editId;
    
    if (editId) {
      // Update existing request
      console.log('Updating request:', editId, request);
      await db.collection('requests').doc(editId).update({
        ...request,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showAlert('Blood request updated successfully', 'success');
    } else {
      // Add new request
      console.log('Adding request:', request);
      const docRef = await db.collection('requests').add(request);
      console.log('Request added with ID:', docRef.id);
      
      showAlert('Blood request added successfully', 'success');
    }
    
    // Reset form and modal
    form.reset();
    delete form.dataset.editId;
    
    // Reset modal title and button
    const modalTitle = document.querySelector('#requestModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Add Blood Request';
    
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Submit Request';
    
    closeRequestModal();
    
    // Reload requests
    setTimeout(() => {
      loadRequests();
    }, 500);
    
  } catch (error) {
    console.error('Error saving request:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your admin privileges.', 'danger');
    } else {
      showAlert('Error saving request: ' + error.message, 'danger');
    }
  }
}

// Debug function to test CRUD operations
window.testCRUD = async function() {
  console.log('🧪 Testing CRUD operations...');
  
  try {
    // Test 1: Check if user is authenticated
    if (!currentUser) {
      console.error('❌ No user authenticated');
      showAlert('Please login first', 'warning');
      return;
    }
    
    console.log('✅ User authenticated:', currentUser.email);
    
    // Test 2: Check admin privileges
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore');
      showAlert('User document not found. Please contact admin.', 'danger');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User data:', userData);
    
    if (userData.role !== 'admin') {
      console.error('❌ User is not admin');
      showAlert('Admin privileges required', 'danger');
      return;
    }
    
    console.log('✅ Admin privileges confirmed');
    
    // Test 3: Test reading donors
    const donorsSnapshot = await db.collection('donors').limit(1).get();
    console.log('✅ Donors read test:', donorsSnapshot.size, 'donors found');
    
    // Test 4: Test adding a donor
    const testDonor = {
      name: 'Test Donor ' + Date.now(),
      bloodGroup: 'O+',
      age: 25,
      gender: 'Male',
      contact: '1234567890',
      address: 'Test Address',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      source: 'test'
    };
    
    const docRef = await db.collection('donors').add(testDonor);
    console.log('✅ Test donor added with ID:', docRef.id);
    
    // Test 5: Delete the test donor
    await db.collection('donors').doc(docRef.id).delete();
    console.log('✅ Test donor deleted');
    
    showAlert('CRUD test completed successfully! ✅', 'success');
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Check Firestore rules and admin setup.', 'danger');
    } else {
      showAlert('CRUD test failed: ' + error.message, 'danger');
    }
  }
};

async function submitBloodRequest() {
  const form = document.getElementById('blood-request-form');
  if (!form) {
    showAlert('Blood request form not found', 'danger');
    return;
  }
  
  const formData = new FormData(form);
  
  // Validate required fields
  const patientName = formData.get('patientName')?.trim();
  const bloodGroup = formData.get('bloodGroup');
  const hospital = formData.get('hospital')?.trim();
  const contact = formData.get('contact')?.trim();
  const units = parseInt(formData.get('units'));
  
  if (!patientName || !bloodGroup || !hospital || !contact || !units) {
    showAlert('Please fill in all required fields', 'warning');
    return;
  }
  
  const request = {
    patientName: patientName,
    bloodGroup: bloodGroup,
    hospital: hospital,
    contact: contact,
    units: units,
    status: 'Pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    source: 'public'
  };
  
  try {
    console.log('Submitting public blood request:', request);
    const docRef = await db.collection('requests').add(request);
    console.log('Public request added with ID:', docRef.id);
    
    showAlert(`Blood request submitted successfully! Request ID: ${docRef.id}`, 'success');
    form.reset();
    
    console.log('Public blood request submitted successfully');
    
  } catch (error) {
    console.error('Error submitting blood request:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Unable to submit request at this time.', 'danger');
    } else {
      showAlert('Error submitting request: ' + error.message, 'danger');
    }
  }
}

// Helper function to create sample blood requests for testing
window.createSampleRequests = async function() {
  try {
    if (!currentUser) {
      showAlert('Please login first', 'warning');
      return;
    }
    
    console.log('Creating sample blood requests...');
    
    const sampleRequests = [
      {
        patientName: 'John Doe',
        bloodGroup: 'O+',
        hospital: 'City General Hospital',
        contact: '9876543210',
        units: 2,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      },
      {
        patientName: 'Jane Smith',
        bloodGroup: 'A+',
        hospital: 'Metro Medical Center',
        contact: '9876543211',
        units: 1,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      },
      {
        patientName: 'Bob Wilson',
        bloodGroup: 'B+',
        hospital: 'Regional Hospital',
        contact: '9876543212',
        units: 3,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      }
    ];
    
    const requestIds = [];
    
    for (const request of sampleRequests) {
      const docRef = await db.collection('requests').add(request);
      requestIds.push(docRef.id);
      console.log('Added sample request:', docRef.id);
    }
    
    // Auto-approve the first two requests
    for (let i = 0; i < 2; i++) {
      await db.collection('requests').doc(requestIds[i]).update({
        status: 'Approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Approved request:', requestIds[i]);
    }
    
    showAlert('Sample requests created and approved! You can now test handover functionality.', 'success');
    
    // Reload requests if on requests page
    if (currentPage === 'requests') {
      loadRequests();
    }
    
  } catch (error) {
    console.error('Error creating sample requests:', error);
    showAlert('Error creating sample requests: ' + error.message, 'danger');
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔥 Blood Bank App initialized');
  // Auth state will be handled by onAuthStateChanged
});

// Placeholder functions for missing functionality
async function loadDashboardCharts() {
  try {
    console.log('Loading dashboard charts...');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library not loaded');
      showAlert('Chart.js library not available. Please check your internet connection.', 'warning');
      return;
    }
    
    // Load recent donations chart
    await loadRecentDonationsChart();
    
    // Load blood group distribution chart  
    await loadBloodGroupChart();
    
    console.log('Dashboard charts loaded successfully');
  } catch (error) {
    console.error('Error loading dashboard charts:', error);
    showAlert('Error loading dashboard charts: ' + error.message, 'danger');
  }
}

// Recent Donations Chart
async function loadRecentDonationsChart() {
  try {
    const ctx = document.getElementById('donationsChart');
    if (!ctx) {
      console.error('Donations chart canvas not found');
      return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not available for donations chart');
      const parent = ctx.parentElement;
      parent.innerHTML = `
        <div class="text-center p-3">
          <i class="bi bi-exclamation-triangle text-warning"></i>
          <p class="mb-0 mt-2">Chart.js library not loaded</p>
          <small class="text-muted">Please check your internet connection</small>
        </div>
      `;
      return;
    }
    
    console.log('Loading recent donations chart...');
    
    // Simplified approach - get all donations and process client-side
    const donationsSnapshot = await db.collection('donations').get();
    
    console.log('Total donations found:', donationsSnapshot.size);
    
    // Get last 7 days
    const last7Days = [];
    const donationCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
      
      // Count donations for this day (simplified)
      let count = 0;
      donationsSnapshot.forEach(doc => {
        const donation = doc.data();
        if (donation.createdAt && donation.createdAt.seconds) {
          const donationDate = new Date(donation.createdAt.seconds * 1000);
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          
          // Check if same day
          if (donationDate.toDateString() === checkDate.toDateString()) {
            count++;
          }
        }
      });
      
      donationCounts.push(count);
    }
    
    console.log('Donation counts by day:', donationCounts);
    
    // Destroy existing chart if it exists
    if (window.donationsChart && typeof window.donationsChart.destroy === 'function') {
      window.donationsChart.destroy();
    }
    
    // Create new chart
    window.donationsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{
          label: 'Donations',
          data: donationCounts,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Last 7 Days'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    console.log('Recent donations chart created successfully');
  } catch (error) {
    console.error('Error loading recent donations chart:', error);
    
    // Show detailed error info
    const canvas = document.getElementById('donationsChart');
    if (canvas) {
      const parent = canvas.parentElement;
      parent.innerHTML = `
        <div class="text-center p-3">
          <i class="bi bi-exclamation-triangle text-warning"></i>
          <p class="mb-0 mt-2">Unable to load donations chart</p>
          <small class="text-muted">Error: ${error.message}</small>
        </div>
      `;
    }
  }
}

// Blood Group Distribution Chart
async function loadBloodGroupChart() {
  try {
    const ctx = document.getElementById('bloodGroupChart');
    if (!ctx) {
      console.error('Blood group chart canvas not found');
      return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not available for blood group chart');
      const parent = ctx.parentElement;
      parent.innerHTML = `
        <div class="text-center p-3">
          <i class="bi bi-exclamation-triangle text-warning"></i>
          <p class="mb-0 mt-2">Chart.js library not loaded</p>
          <small class="text-muted">Please check your internet connection</small>
        </div>
      `;
      return;
    }
    
    console.log('Loading blood group distribution chart...');
    
    // Get all donors and process client-side
    const donorsSnapshot = await db.collection('donors').get();
    
    console.log('Total donors found:', donorsSnapshot.size);
    
    // Count donors by blood group
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodGroupCounts = bloodGroups.map(() => 0);
    
    donorsSnapshot.forEach(doc => {
      const donor = doc.data();
      const bloodGroup = donor.bloodGroup;
      const index = bloodGroups.indexOf(bloodGroup);
      if (index !== -1) {
        bloodGroupCounts[index]++;
      }
    });
    
    console.log('Blood group counts:', bloodGroups.map((bg, i) => `${bg}: ${bloodGroupCounts[i]}`));
    
    // Filter out blood groups with 0 donors for better visualization
    const filteredLabels = [];
    const filteredCounts = [];
    const filteredColors = [];
    
    const colors = [
      '#dc3545', // A+ - Red
      '#fd7e14', // A- - Orange  
      '#198754', // B+ - Green
      '#20c997', // B- - Teal
      '#0d6efd', // AB+ - Blue
      '#6610f2', // AB- - Indigo
      '#d63384', // O+ - Pink
      '#6f42c1'  // O- - Purple
    ];
    
    bloodGroups.forEach((bg, i) => {
      if (bloodGroupCounts[i] > 0) {
        filteredLabels.push(bg);
        filteredCounts.push(bloodGroupCounts[i]);
        filteredColors.push(colors[i]);
      }
    });
    
    // If no donors, show a message
    if (filteredCounts.length === 0) {
      const parent = ctx.parentElement;
      parent.innerHTML = `
        <div class="text-center p-3">
          <i class="bi bi-info-circle text-info"></i>
          <p class="mb-0 mt-2">No donors registered yet</p>
          <small class="text-muted">Add some donors to see the distribution</small>
        </div>
      `;
      return;
    }
    
    // Destroy existing chart if it exists
    if (window.bloodGroupChart && typeof window.bloodGroupChart.destroy === 'function') {
      window.bloodGroupChart.destroy();
    }
    
    // Create new chart
    window.bloodGroupChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: filteredLabels,
        datasets: [{
          label: 'Donors',
          data: filteredCounts,
          backgroundColor: filteredColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: `Total Donors: ${donorsSnapshot.size}`
          }
        }
      }
    });
    
    console.log('Blood group distribution chart created successfully');
  } catch (error) {
    console.error('Error loading blood group chart:', error);
    
    // Show detailed error info
    const canvas = document.getElementById('bloodGroupChart');
    if (canvas) {
      const parent = canvas.parentElement;
      parent.innerHTML = `
        <div class="text-center p-3">
          <i class="bi bi-exclamation-triangle text-warning"></i>
          <p class="mb-0 mt-2">Unable to load blood group chart</p>
          <small class="text-muted">Error: ${error.message}</small>
        </div>
      `;
    }
  }
}

// Donations functions
async function loadDonations() {
  try {
    console.log('Loading donations...');
    
    const querySnapshot = await db.collection('donations')
      .orderBy('createdAt', 'desc')
      .get();
    
    const tbody = document.querySelector('#donations-table tbody');
    if (!tbody) {
      console.error('Donations table not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No donations found</td></tr>';
      return;
    }
    
    // Process donations
    for (const doc of querySnapshot.docs) {
      const donation = doc.data();
      let donorName = 'Unknown';
      
      // Get donor name if donorId exists
      if (donation.donorId) {
        try {
          const donorDoc = await db.collection('donors').doc(donation.donorId).get();
          if (donorDoc.exists) {
            donorName = donorDoc.data().name;
          }
        } catch (error) {
          console.error('Error fetching donor:', error);
        }
      }
      
      const row = document.createElement('tr');
      const donationDate = donation.date ? 
        (donation.date.seconds ? new Date(donation.date.seconds * 1000).toLocaleDateString() : donation.date) : 
        'N/A';
      
      row.innerHTML = `
        <td>${doc.id.substring(0, 8)}...</td>
        <td>${donationDate}</td>
        <td>${donorName}</td>
        <td><span class="badge bg-danger">${donation.bloodGroup || 'N/A'}</span></td>
        <td><strong>${donation.units || 0}</strong></td>
        <td>${donation.notes || ''}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editDonation('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDonation('${doc.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    }
    
    console.log(`Loaded ${querySnapshot.size} donations`);
  } catch (error) {
    console.error('Load donations error:', error);
    showAlert('Error loading donations: ' + error.message, 'danger');
    
    const tbody = document.querySelector('#donations-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading donations</td></tr>';
    }
  }
}

async function addDonation() {
  const form = document.getElementById('donation-form');
  if (!form) {
    showAlert('Donation form not found', 'danger');
    return;
  }
  
  const formData = new FormData(form);
  
  // Validate required fields
  const donorId = formData.get('donorId');
  const bloodGroup = formData.get('bloodGroup');
  const date = formData.get('date');
  const units = parseInt(formData.get('units'));
  
  if (!donorId || !bloodGroup || !date || !units) {
    showAlert('Please fill in all required fields', 'warning');
    return;
  }
  
  const donation = {
    donorId: donorId,
    bloodGroup: bloodGroup,
    date: new Date(date),
    units: units,
    notes: formData.get('notes')?.trim() || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    // Check if this is an edit operation
    const editId = form.dataset.editId;
    
    if (editId) {
      // Update existing donation
      console.log('Updating donation:', editId, donation);
      await db.collection('donations').doc(editId).update({
        ...donation,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showAlert('Donation updated successfully', 'success');
    } else {
      // Add new donation
      console.log('Adding donation:', donation);
      const docRef = await db.collection('donations').add(donation);
      console.log('Donation added with ID:', docRef.id);
      
      showAlert('Donation recorded successfully', 'success');
    }
    
    // Reset form and modal
    form.reset();
    delete form.dataset.editId;
    
    // Reset modal title and button
    const modalTitle = document.querySelector('#donationModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Donation';
    
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Donation';
    
    closeDonationModal();
    
    // Reload donations and update dashboard
    setTimeout(() => {
      loadDonations();
      loadInventory();
      // Also reload dashboard to update charts and stats
      if (currentPage === 'dashboard') {
        loadDashboard();
      }
    }, 500);
    
  } catch (error) {
    console.error('Error saving donation:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your admin privileges.', 'danger');
    } else {
      showAlert('Error saving donation: ' + error.message, 'danger');
    }
  }
}

function editDonation(id) {
  if (!id) {
    showAlert('Invalid donation ID', 'danger');
    return;
  }
  
  console.log('Editing donation:', id);
  
  // Fetch donation data
  db.collection('donations').doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        showAlert('Donation not found', 'danger');
        return;
      }
      
      const donation = doc.data();
      
      // Load donors first
      loadDonorsForSelect().then(() => {
        // Populate edit form
        const form = document.getElementById('donation-form');
        if (!form) {
          showAlert('Donation form not found', 'danger');
          return;
        }
        
        // Fill form with existing data
        const donorSelect = form.querySelector('[name="donorId"]');
        if (donorSelect) donorSelect.value = donation.donorId || '';
        
        const bloodGroupInput = form.querySelector('[name="bloodGroup"]');
        if (bloodGroupInput) bloodGroupInput.value = donation.bloodGroup || '';
        
        // Handle date - convert Firebase timestamp to date string
        const dateInput = form.querySelector('[name="date"]');
        if (dateInput && donation.date) {
          const date = donation.date.seconds ? 
            new Date(donation.date.seconds * 1000) : 
            new Date(donation.date);
          dateInput.value = date.toISOString().split('T')[0];
        }
        
        const unitsInput = form.querySelector('[name="units"]');
        if (unitsInput) unitsInput.value = donation.units || '';
        
        const notesInput = form.querySelector('[name="notes"]');
        if (notesInput) notesInput.value = donation.notes || '';
        
        // Store donation ID for update
        form.dataset.editId = id;
        
        // Change form title and button
        const modalTitle = document.querySelector('#donationModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Donation';
        
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Donation';
        
        // Show modal
        showDonationModal();
      });
    })
    .catch(error => {
      console.error('Error fetching donation:', error);
      showAlert('Error loading donation data: ' + error.message, 'danger');
    });
}

function deleteDonation(id) {
  if (confirm('Are you sure you want to delete this donation?')) {
    db.collection('donations').doc(id).delete().then(() => {
      showAlert('Donation deleted successfully');
      loadDonations();
    }).catch(error => {
      showAlert('Error deleting donation: ' + error.message, 'danger');
    });
  }
}

// Requests functions
async function loadRequests() {
  try {
    const querySnapshot = await db.collection('requests')
      .orderBy('createdAt', 'desc')
      .get();
    
    const tbody = document.querySelector('#requests-table tbody');
    if (!tbody) {
      console.error('Requests table not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    // Process requests and check blood availability for approved requests
    for (const doc of querySnapshot.docs) {
      const request = doc.data();
      const row = document.createElement('tr');
      const requestDate = request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
      
      let statusBadge = '';
      switch(request.status) {
        case 'Pending':
          statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
          break;
        case 'Approved':
          statusBadge = '<span class="badge bg-success">Approved</span>';
          break;
        case 'Rejected':
          statusBadge = '<span class="badge bg-danger">Rejected</span>';
          break;
        default:
          statusBadge = '<span class="badge bg-secondary">Unknown</span>';
      }
      
      // Check blood availability for pending requests
      let availabilityInfo = '';
      if (request.status === 'Pending') {
        const isAvailable = await checkBloodAvailability(request.bloodGroup, request.units);
        if (!isAvailable) {
          availabilityInfo = '<br><small class="text-danger"><i class="bi bi-exclamation-circle"></i> Insufficient stock</small>';
        }
      }
      
      row.innerHTML = `
        <td>${doc.id.substring(0, 8)}...</td>
        <td>${request.patientName || 'N/A'}</td>
        <td><span class="badge bg-primary">${request.bloodGroup || 'N/A'}</span></td>
        <td>${request.hospital || 'N/A'}</td>
        <td>${request.contact || 'N/A'}</td>
        <td>${request.units || 1}</td>
        <td>${statusBadge}${availabilityInfo}</td>
        <td>${requestDate}</td>
        <td>
          ${request.status === 'Pending' ? `
            <button class="btn btn-sm btn-success" onclick="approveRequest('${doc.id}')">Approve</button>
            <button class="btn btn-sm btn-danger" onclick="rejectRequest('${doc.id}')">Reject</button>
          ` : ''}
          <button class="btn btn-sm btn-primary" onclick="editRequest('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRequest('${doc.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (error) {
    showAlert('Error loading requests: ' + error.message, 'danger');
    console.error('Load requests error:', error);
  }
}

async function approveRequest(id) {
  try {
    // First, get the request details
    const requestDoc = await db.collection('requests').doc(id).get();
    if (!requestDoc.exists) {
      showAlert('Request not found', 'danger');
      return;
    }
    
    const request = requestDoc.data();
    
    // Check if blood is available before approving
    const isBloodAvailable = await checkBloodAvailability(request.bloodGroup, request.units);
    if (!isBloodAvailable) {
      showAlert(`Insufficient ${request.bloodGroup} blood units available. Cannot approve this request.`, 'warning');
      return;
    }
    
    await db.collection('requests').doc(id).update({
      status: 'Approved',
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showAlert('Request approved successfully', 'success');
    loadRequests();
    
    // If we're on the dashboard, update it too
    if (currentPage === 'dashboard') {
      loadDashboard();
    }
  } catch (error) {
    showAlert('Error approving request: ' + error.message, 'danger');
  }
}

async function rejectRequest(id) {
  try {
    await db.collection('requests').doc(id).update({
      status: 'Rejected',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showAlert('Request rejected', 'warning');
    loadRequests();
  } catch (error) {
    showAlert('Error rejecting request: ' + error.message, 'danger');
  }
}

function editRequest(id) {
  if (!id) {
    showAlert('Invalid request ID', 'danger');
    return;
  }
  
  console.log('Editing request:', id);
  
  // Fetch request data
  db.collection('requests').doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        showAlert('Request not found', 'danger');
        return;
      }
      
      const request = doc.data();
      
      // Populate edit form
      const form = document.getElementById('request-form');
      if (!form) {
        showAlert('Request form not found', 'danger');
        return;
      }
      
      // Fill form with existing data
      const patientNameInput = form.querySelector('[name="patientName"]');
      if (patientNameInput) patientNameInput.value = request.patientName || '';
      
      const bloodGroupInput = form.querySelector('[name="bloodGroup"]');
      if (bloodGroupInput) bloodGroupInput.value = request.bloodGroup || '';
      
      const hospitalInput = form.querySelector('[name="hospital"]');
      if (hospitalInput) hospitalInput.value = request.hospital || '';
      
      const contactInput = form.querySelector('[name="contact"]');
      if (contactInput) contactInput.value = request.contact || '';
      
      const unitsInput = form.querySelector('[name="units"]');
      if (unitsInput) unitsInput.value = request.units || '';
      
      const statusInput = form.querySelector('[name="status"]');
      if (statusInput) statusInput.value = request.status || 'Pending';
      
      // Store request ID for update
      form.dataset.editId = id;
      
      // Change form title and button
      const modalTitle = document.querySelector('#requestModal .modal-title');
      if (modalTitle) modalTitle.textContent = 'Edit Blood Request';
      
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Update Request';
      
      // Show modal
      showRequestModal();
    })
    .catch(error => {
      console.error('Error fetching request:', error);
      showAlert('Error loading request data: ' + error.message, 'danger');
    });
}

function deleteRequest(id) {
  if (confirm('Are you sure you want to delete this request?')) {
    db.collection('requests').doc(id).delete().then(() => {
      showAlert('Request deleted successfully');
      loadRequests();
    }).catch(error => {
      showAlert('Error deleting request: ' + error.message, 'danger');
    });
  }
}

// Handover functions
async function loadHandover() {
  try {
    const querySnapshot = await db.collection('handover')
      .orderBy('createdAt', 'desc')
      .get();
    
    const tbody = document.querySelector('#handover-table tbody');
    if (!tbody) {
      console.error('Handover table not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    // Get request details for each handover
    for (const doc of querySnapshot.docs) {
      const handover = doc.data();
      let requestDetails = { patientName: 'Unknown', bloodGroup: 'N/A', hospital: 'N/A' };
      
      if (handover.requestId) {
        try {
          const requestDoc = await db.collection('requests').doc(handover.requestId).get();
          if (requestDoc.exists) {
            const reqData = requestDoc.data();
            requestDetails = {
              patientName: reqData.patientName || 'Unknown',
              bloodGroup: reqData.bloodGroup || 'N/A',
              hospital: reqData.hospital || 'N/A'
            };
          }
        } catch (error) {
          console.error('Error fetching request:', error);
        }
      }
      
      const row = document.createElement('tr');
      const handoverDate = handover.date ? new Date(handover.date.seconds * 1000).toLocaleDateString() : 'N/A';
      
      row.innerHTML = `
        <td>${doc.id}</td>
        <td>${requestDetails.patientName}</td>
        <td>${requestDetails.bloodGroup}</td>
        <td>${requestDetails.hospital}</td>
        <td>${handoverDate}</td>
        <td>${handover.unitsGiven || 0}</td>
        <td>${handover.notes || ''}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editHandover('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteHandover('${doc.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (error) {
    showAlert('Error loading handover records: ' + error.message, 'danger');
    console.error('Load handover error:', error);
  }
}

async function addHandover() {
  const form = document.getElementById('handover-form');
  if (!form) {
    showAlert('Handover form not found', 'danger');
    return;
  }
  
  const formData = new FormData(form);
  
  // Validate required fields
  const requestId = formData.get('requestId');
  const date = formData.get('date');
  const unitsGiven = parseInt(formData.get('unitsGiven'));
  
  if (!requestId || !date || !unitsGiven) {
    showAlert('Please fill in all required fields', 'warning');
    return;
  }
  
  try {
    // First, check if the request exists and get its details
    const requestDoc = await db.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      showAlert('Request not found', 'danger');
      return;
    }
    
    const request = requestDoc.data();
    
    // Check if request is approved
    if (request.status !== 'Approved') {
      showAlert('Only approved requests can be handed over', 'warning');
      return;
    }
    
    // Check blood availability
    const isBloodAvailable = await checkBloodAvailability(request.bloodGroup, unitsGiven);
    if (!isBloodAvailable) {
      showAlert(`Insufficient ${request.bloodGroup} blood units available for this handover`, 'danger');
      return;
    }
    
    const handover = {
      requestId: requestId,
      date: firebase.firestore.Timestamp.fromDate(new Date(date)),
      unitsGiven: unitsGiven,
      notes: formData.get('notes') || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Check if this is an edit operation
    const editId = form.dataset.editId;
    
    if (editId) {
      // Update existing handover
      console.log('Updating handover:', editId, handover);
      await db.collection('handover').doc(editId).update({
        ...handover,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showAlert('Handover record updated successfully', 'success');
    } else {
      // Add new handover
      console.log('Adding handover:', handover);
      await db.collection('handover').add(handover);
      
      showAlert('Handover record added successfully', 'success');
    }
    
    // Reset form and modal
    form.reset();
    delete form.dataset.editId;
    
    // Reset modal title and button
    const modalTitle = document.querySelector('#handoverModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Add Handover Record';
    
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Handover';
    
    closeHandoverModal();
    
    // Reload handover and update inventory
    setTimeout(() => {
      loadHandover();
      loadInventory();
      // Also reload dashboard to update stock counts
      if (currentPage === 'dashboard') {
        loadDashboard();
      }
    }, 500);
    
  } catch (error) {
    console.error('Error saving handover record:', error);
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your admin privileges.', 'danger');
    } else {
      showAlert('Error saving handover record: ' + error.message, 'danger');
    }
  }
}

// New function to check blood availability
async function checkBloodAvailability(bloodGroup, unitsNeeded) {
  try {
    // Get total donations for this blood group
    const donationsSnapshot = await db.collection('donations')
      .where('bloodGroup', '==', bloodGroup)
      .get();
    
    let totalDonated = 0;
    donationsSnapshot.forEach(doc => {
      totalDonated += doc.data().units || 0;
    });
    
    // Get total handovers for this blood group
    let totalGiven = 0;
    const requestsSnapshot = await db.collection('requests')
      .where('bloodGroup', '==', bloodGroup)
      .where('status', '==', 'Approved')
      .get();
    
    for (const requestDoc of requestsSnapshot.docs) {
      const handoverSnapshot = await db.collection('handover')
        .where('requestId', '==', requestDoc.id)
        .get();
      
      handoverSnapshot.forEach(handoverDoc => {
        totalGiven += handoverDoc.data().unitsGiven || 0;
      });
    }
    
    const available = Math.max(0, totalDonated - totalGiven);
    return available >= unitsNeeded;
  } catch (error) {
    console.error('Error checking blood availability:', error);
    // In case of error, we'll allow the handover to proceed to avoid blocking the system
    // but log the error for investigation
    return true;
  }
}

function editHandover(id) {
  if (!id) {
    showAlert('Invalid handover ID', 'danger');
    return;
  }
  
  console.log('Editing handover:', id);
  
  // Fetch handover data
  db.collection('handover').doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        showAlert('Handover record not found', 'danger');
        return;
      }
      
      const handover = doc.data();
      
      // Load approved requests first
      loadApprovedRequestsForSelect().then(() => {
        // Populate edit form
        const form = document.getElementById('handover-form');
        if (!form) {
          showAlert('Handover form not found', 'danger');
          return;
        }
        
        // Fill form with existing data
        const requestSelect = form.querySelector('[name="requestId"]');
        if (requestSelect) requestSelect.value = handover.requestId || '';
        
        // Handle date - convert Firebase timestamp to date string
        const dateInput = form.querySelector('[name="date"]');
        if (dateInput && handover.date) {
          const date = handover.date.seconds ? 
            new Date(handover.date.seconds * 1000) : 
            new Date(handover.date);
          dateInput.value = date.toISOString().split('T')[0];
        }
        
        const unitsInput = form.querySelector('[name="unitsGiven"]');
        if (unitsInput) unitsInput.value = handover.unitsGiven || '';
        
        const notesInput = form.querySelector('[name="notes"]');
        if (notesInput) notesInput.value = handover.notes || '';
        
        // Store handover ID for update
        form.dataset.editId = id;
        
        // Change form title and button
        const modalTitle = document.querySelector('#handoverModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Handover Record';
        
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Handover';
        
        // Show modal
        showHandoverModal();
      });
    })
    .catch(error => {
      console.error('Error fetching handover:', error);
      showAlert('Error loading handover data: ' + error.message, 'danger');
    });
}

function deleteHandover(id) {
  if (confirm('Are you sure you want to delete this handover record?')) {
    db.collection('handover').doc(id).delete().then(() => {
      showAlert('Handover record deleted successfully');
      loadHandover();
    }).catch(error => {
      showAlert('Error deleting handover record: ' + error.message, 'danger');
    });
  }
}

// Inventory functions
async function loadInventory() {
  try {
    // Calculate inventory from donations and handovers
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryData = [];
    
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      
      inventoryData.push({
        bloodGroup,
        totalDonated,
        totalGiven,
        available
      });
    }
    
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) {
      console.error('Inventory table not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    inventoryData.forEach(item => {
      const row = document.createElement('tr');
      const statusClass = item.available === 0 ? 'table-danger' : 
                         item.available <= 2 ? 'table-warning' : 
                         'table-success';
      
      // Add visual indicator for low stock
      const lowStockWarning = item.available <= 2 && item.available > 0 ? 
        '<i class="bi bi-exclamation-triangle text-warning me-1"></i>' : '';
      
      row.className = statusClass;
      row.innerHTML = `
        <td><strong>${item.bloodGroup}</strong></td>
        <td>${item.totalDonated}</td>
        <td>${item.totalGiven}</td>
        <td><strong>${lowStockWarning}${item.available}</strong></td>
        <td>
          ${item.available === 0 ? '<span class="badge bg-danger">Out of Stock</span>' :
            item.available <= 2 ? '<span class="badge bg-warning text-dark">Low Stock</span>' :
            '<span class="badge bg-success">Available</span>'}
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Update dashboard stock total
    const totalStock = inventoryData.reduce((sum, item) => sum + item.available, 0);
    const stockElement = document.getElementById('total-stock');
    if (stockElement) {
      stockElement.textContent = totalStock;
    }
    
    // Update low stock count on dashboard
    const lowStockCount = inventoryData.filter(item => item.available > 0 && item.available <= 2).length;
    const lowStockElement = document.getElementById('low-stock-count');
    if (lowStockElement) {
      lowStockElement.textContent = lowStockCount;
    }
    
  } catch (error) {
    showAlert('Error loading inventory: ' + error.message, 'danger');
    console.error('Load inventory error:', error);
  }
}

// Inventory functions for dashboard
async function loadInventoryForDashboard() {
  try {
    // Calculate inventory from donations and handovers
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let totalAvailable = 0;
    let lowStockCount = 0;
    
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      totalAvailable += available;
      
      if (available <= 2 && available > 0) {
        lowStockCount++;
      }
    }
    
    // Update dashboard elements
    const stockElement = document.getElementById('total-stock');
    if (stockElement) {
      stockElement.textContent = totalAvailable;
    }
    
    const lowStockElement = document.getElementById('low-stock-count');
    if (lowStockElement) {
      lowStockElement.textContent = lowStockCount;
    }
    
  } catch (error) {
    console.error('Error loading inventory for dashboard:', error);
  }
}

// Recent Activity Feed
async function loadRecentActivity() {
  try {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;
    
    // Get recent activities from different collections
    const activities = [];
    
    // Get recent donations
    const donationsSnapshot = await db.collection('donations')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    for (const doc of donationsSnapshot.docs) {
      const donation = doc.data();
      let donorName = 'Unknown Donor';
      
      // Get donor name
      if (donation.donorId) {
        try {
          const donorDoc = await db.collection('donors').doc(donation.donorId).get();
          if (donorDoc.exists) {
            donorName = donorDoc.data().name || 'Unknown Donor';
          }
        } catch (error) {
          console.error('Error fetching donor:', error);
        }
      }
      
      const donationDate = donation.createdAt ? new Date(donation.createdAt.seconds * 1000) : new Date();
      activities.push({
        type: 'donation',
        message: `${donorName} donated ${donation.units || 0} unit(s) of ${donation.bloodGroup || 'unknown'} blood`,
        date: donationDate,
        icon: 'droplet',
        color: 'success'
      });
    }
    
    // Get recent requests
    const requestsSnapshot = await db.collection('requests')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    for (const doc of requestsSnapshot.docs) {
      const request = doc.data();
      const requestDate = request.createdAt ? new Date(request.createdAt.seconds * 1000) : new Date();
      activities.push({
        type: 'request',
        message: `Blood request for ${request.patientName || 'unknown patient'} (${request.bloodGroup || 'unknown'}) - ${request.status || 'Pending'}`,
        date: requestDate,
        icon: 'person-plus',
        color: request.status === 'Approved' ? 'info' : 'warning'
      });
    }
    
    // Get recent handovers
    const handoverSnapshot = await db.collection('handover')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    for (const doc of handoverSnapshot.docs) {
      const handover = doc.data();
      let patientName = 'Unknown Patient';
      
      // Get patient name from request
      if (handover.requestId) {
        try {
          const requestDoc = await db.collection('requests').doc(handover.requestId).get();
          if (requestDoc.exists) {
            patientName = requestDoc.data().patientName || 'Unknown Patient';
          }
        } catch (error) {
          console.error('Error fetching request:', error);
        }
      }
      
      const handoverDate = handover.createdAt ? new Date(handover.createdAt.seconds * 1000) : new Date();
      activities.push({
        type: 'handover',
        message: `${handover.unitsGiven || 0} unit(s) given to ${patientName}`,
        date: handoverDate,
        icon: 'arrow-right-circle',
        color: 'primary'
      });
    }
    
    // Sort activities by date (newest first)
    activities.sort((a, b) => b.date - a.date);
    
    // Take only the 10 most recent activities
    const recentActivities = activities.slice(0, 10);
    
    // Render activities
    if (recentActivities.length === 0) {
      activityContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-info-circle text-muted" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0 text-muted">No recent activity</p>
        </div>
      `;
      return;
    }
    
    let activityHtml = '';
    recentActivities.forEach(activity => {
      const timeAgo = getTimeAgo(activity.date);
      activityHtml += `
        <div class="activity-item mb-3">
          <div class="d-flex">
            <div class="flex-shrink-0">
              <div class="rounded-circle bg-${activity.color} text-white d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                <i class="bi bi-${activity.icon}"></i>
              </div>
            </div>
            <div class="flex-grow-1 ms-3">
              <p class="mb-1">${activity.message}</p>
              <small class="text-muted">${timeAgo}</small>
            </div>
          </div>
        </div>
      `;
    });
    
    activityContainer.innerHTML = activityHtml;
    
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const activityContainer = document.getElementById('recent-activity');
    if (activityContainer) {
      activityContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0 text-muted">Error loading activity feed</p>
        </div>
      `;
    }
  }
}

// Enhanced loadInventoryForDashboard to show alerts for low stock
async function loadInventoryForDashboard() {
  try {
    // Calculate inventory from donations and handovers
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let totalAvailable = 0;
    let lowStockCount = 0;
    const lowStockItems = [];
    
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      totalAvailable += available;
      
      if (available <= 2 && available > 0) {
        lowStockCount++;
        lowStockItems.push({ bloodGroup, available });
      } else if (available === 0) {
        lowStockItems.push({ bloodGroup, available });
      }
    }
    
    // Update dashboard elements
    const stockElement = document.getElementById('total-stock');
    if (stockElement) {
      stockElement.textContent = totalAvailable;
    }
    
    const lowStockElement = document.getElementById('low-stock-count');
    if (lowStockElement) {
      lowStockElement.textContent = lowStockCount;
    }
    
    // Show alerts for critical low stock
    if (lowStockItems.length > 0) {
      const criticalItems = lowStockItems.filter(item => item.available === 0);
      if (criticalItems.length > 0) {
        showAlert(`CRITICAL: ${criticalItems.length} blood type(s) are out of stock: ${criticalItems.map(item => item.bloodGroup).join(', ')}`, 'danger');
      } else {
        const lowItems = lowStockItems.filter(item => item.available > 0);
        if (lowItems.length > 0) {
          showAlert(`WARNING: ${lowItems.length} blood type(s) are low in stock: ${lowItems.map(item => `${item.bloodGroup} (${item.available} units)`).join(', ')}`, 'warning');
        }
      }
    }
    
  } catch (error) {
    console.error('Error loading inventory for dashboard:', error);
  }
}

// Blood Stock Status
async function loadStockStatus() {
  try {
    const stockContainer = document.getElementById('stock-status');
    if (!stockContainer) return;
    
    // Calculate inventory from donations and handovers
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryData = [];
    
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      
      inventoryData.push({
        bloodGroup,
        available,
        status: available === 0 ? 'out' : available <= 2 ? 'low' : 'good'
      });
    }
    
    // Filter to show only low/out of stock items, or top 5 if all are good
    const criticalItems = inventoryData.filter(item => item.status !== 'good');
    let displayItems = criticalItems;
    
    if (criticalItems.length === 0) {
      // If all items are good, show top 5
      displayItems = [...inventoryData]
        .sort((a, b) => a.available - b.available)
        .slice(0, 5);
    }
    
    // Render stock status
    if (displayItems.length === 0) {
      stockContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0 text-success">All blood types are well stocked!</p>
        </div>
      `;
      return;
    }
    
    let stockHtml = '<div class="list-group">';
    
    displayItems.forEach(item => {
      let statusClass = '';
      let statusText = '';
      let icon = '';
      
      switch (item.status) {
        case 'out':
          statusClass = 'list-group-item-danger';
          statusText = 'Out of Stock';
          icon = 'exclamation-triangle';
          break;
        case 'low':
          statusClass = 'list-group-item-warning';
          statusText = 'Low Stock';
          icon = 'exclamation-circle';
          break;
        default:
          statusClass = 'list-group-item-success';
          statusText = 'Good Stock';
          icon = 'check-circle';
      }
      
      stockHtml += `
        <div class="list-group-item ${statusClass} d-flex justify-content-between align-items-center">
          <div>
            <strong>${item.bloodGroup}</strong>
            <div class="small">${item.available} unit${item.available !== 1 ? 's' : ''} available</div>
          </div>
          <div class="d-flex align-items-center">
            <span class="badge ${item.status === 'out' ? 'bg-danger' : item.status === 'low' ? 'bg-warning text-dark' : 'bg-success'}">
              ${statusText}
            </span>
            <i class="bi bi-${icon} ms-2"></i>
          </div>
        </div>
      `;
    });
    
    stockHtml += '</div>';
    stockContainer.innerHTML = stockHtml;
    
  } catch (error) {
    console.error('Error loading stock status:', error);
    const stockContainer = document.getElementById('stock-status');
    if (stockContainer) {
      stockContainer.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0 text-muted">Error loading stock status</p>
        </div>
      `;
    }
  }
}

function showPublicPortal() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('public-portal').style.display = 'block';
  
  // Load blood availability when showing public portal
  loadBloodAvailability();
}

// New function to load blood availability for public portal
async function loadBloodAvailability() {
  try {
    const bloodAvailabilityContainer = document.getElementById('blood-availability');
    if (!bloodAvailabilityContainer) {
      console.error('Blood availability container not found');
      return;
    }
    
    // Show loading state
    bloodAvailabilityContainer.innerHTML = 
      '<div class="col-12 text-center">' +
      '  <div class="spinner-border text-primary" role="status">' +
      '    <span class="visually-hidden">Loading...</span>' +
      '  </div>' +
      '  <p>Loading blood availability...</p>' +
      '</div>';
    
    // Define all blood groups
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryData = [];
    
    // Calculate inventory for each blood group
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      
      inventoryData.push({
        bloodGroup: bloodGroup,
        available: available
      });
    }
    
    // Generate HTML for all blood groups
    let html = '';
    inventoryData.forEach(function(item) {
      // Determine status color based on availability
      let statusClass = 'bg-success';
      let statusText = 'Available';
      
      if (item.available === 0) {
        statusClass = 'bg-danger';
        statusText = 'Out of Stock';
      } else if (item.available <= 2) {
        statusClass = 'bg-warning text-dark';
        statusText = 'Low Stock';
      }
      
      html += 
        '<div class="col-md-3 col-sm-6 mb-3">' +
        '  <div class="card">' +
        '    <div class="card-body text-center">' +
        '      <h5 class="card-title">' + item.bloodGroup + '</h5>' +
        '      <h3 class="text-primary mb-2">' + item.available + ' Units</h3>' +
        '      <span class="badge ' + statusClass + '">' + statusText + '</span>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    });
    
    // Update the container with the new HTML
    bloodAvailabilityContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading blood availability:', error);
    const bloodAvailabilityContainer = document.getElementById('blood-availability');
    if (bloodAvailabilityContainer) {
      bloodAvailabilityContainer.innerHTML = 
        '<div class="col-12 text-center">' +
        '  <div class="alert alert-danger">' +
        '    <i class="bi bi-exclamation-triangle"></i>' +
        '    Error loading blood availability data. Please try again later.' +
        '  </div>' +
        '</div>';
    }
  }
}

// New function to load blood availability for public portal
async function loadBloodAvailability() {
  try {
    const bloodAvailabilityContainer = document.getElementById('blood-availability');
    if (!bloodAvailabilityContainer) {
      console.error('Blood availability container not found');
      return;
    }
    
    // Show loading state
    bloodAvailabilityContainer.innerHTML = 
      '<div class="col-12 text-center">' +
      '  <div class="spinner-border text-primary" role="status">' +
      '    <span class="visually-hidden">Loading...</span>' +
      '  </div>' +
      '  <p>Loading blood availability...</p>' +
      '</div>';
    
    // Define all blood groups
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryData = [];
    
    // Calculate inventory for each blood group
    for (const bloodGroup of bloodGroups) {
      // Get total donations for this blood group
      const donationsSnapshot = await db.collection('donations')
        .where('bloodGroup', '==', bloodGroup)
        .get();
      
      let totalDonated = 0;
      donationsSnapshot.forEach(doc => {
        totalDonated += doc.data().units || 0;
      });
      
      // Get total handovers for this blood group
      let totalGiven = 0;
      const requestsSnapshot = await db.collection('requests')
        .where('bloodGroup', '==', bloodGroup)
        .where('status', '==', 'Approved')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const handoverSnapshot = await db.collection('handover')
          .where('requestId', '==', requestDoc.id)
          .get();
        
        handoverSnapshot.forEach(handoverDoc => {
          totalGiven += handoverDoc.data().unitsGiven || 0;
        });
      }
      
      const available = Math.max(0, totalDonated - totalGiven);
      
      inventoryData.push({
        bloodGroup: bloodGroup,
        available: available
      });
    }
    
    // Generate HTML for all blood groups
    let html = '';
    inventoryData.forEach(function(item) {
      // Determine status color based on availability
      let statusClass = 'bg-success';
      let statusText = 'Available';
      
      if (item.available === 0) {
        statusClass = 'bg-danger';
        statusText = 'Out of Stock';
      } else if (item.available <= 2) {
        statusClass = 'bg-warning text-dark';
        statusText = 'Low Stock';
      }
      
      html += 
        '<div class="col-md-3 col-sm-6 mb-3">' +
        '  <div class="card">' +
        '    <div class="card-body text-center">' +
        '      <h5 class="card-title">' + item.bloodGroup + '</h5>' +
        '      <h3 class="text-primary mb-2">' + item.available + ' Units</h3>' +
        '      <span class="badge ' + statusClass + '">' + statusText + '</span>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    });
    
    // Update the container with the new HTML
    bloodAvailabilityContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading blood availability:', error);
    const bloodAvailabilityContainer = document.getElementById('blood-availability');
    if (bloodAvailabilityContainer) {
      bloodAvailabilityContainer.innerHTML = 
        '<div class="col-12 text-center">' +
        '  <div class="alert alert-danger">' +
        '    <i class="bi bi-exclamation-triangle"></i>' +
        '    Error loading blood availability data. Please try again later.' +
        '  </div>' +
        '</div>';
    }
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return diffDays + ' day' + (diffDays !== 1 ? 's' : '') + ' ago';
  } else if (diffHours > 0) {
    return diffHours + ' hour' + (diffHours !== 1 ? 's' : '') + ' ago';
  } else if (diffMinutes > 0) {
    return diffMinutes + ' minute' + (diffMinutes !== 1 ? 's' : '') + ' ago';
  } else {
    return 'Just now';
  }
}

// Modal functions
function showDonorModal() {
  try {
    const modalElement = document.getElementById('donorModal');
    if (!modalElement) {
      showAlert('Donor modal not found', 'danger');
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Clear form
    const form = document.getElementById('donor-form');
    if (form) {
      form.reset();
    }
  } catch (error) {
    console.error('Error showing donor modal:', error);
    showAlert('Error opening donor form', 'danger');
  }
}

function closeDonorModal() {
  try {
    const modalElement = document.getElementById('donorModal');
    if (!modalElement) return;
    
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  } catch (error) {
    console.error('Error closing donor modal:', error);
  }
}

function showDonationModal() {
  loadDonorsForSelect();
  const modal = new bootstrap.Modal(document.getElementById('donationModal'));
  modal.show();
}

function closeDonationModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('donationModal'));
  if (modal) modal.hide();
}

function showRequestModal() {
  const modal = new bootstrap.Modal(document.getElementById('requestModal'));
  modal.show();
}

function closeRequestModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
  if (modal) modal.hide();
}

async function showHandoverModal() {
  try {
    console.log('Opening handover modal...');
    
    // Clear form first
    const form = document.getElementById('handover-form');
    if (form) {
      form.reset();
      delete form.dataset.editId;
      
      // Reset modal title and button
      const modalTitle = document.querySelector('#handoverModal .modal-title');
      if (modalTitle) modalTitle.textContent = 'Add Handover Record';
      
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Save Handover';
    }
    
    // Load approved requests
    await loadApprovedRequestsForSelect();
    
    // Show modal
    const modalElement = document.getElementById('handoverModal');
    if (!modalElement) {
      showAlert('Handover modal not found', 'danger');
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    console.log('Handover modal opened successfully');
    
  } catch (error) {
    console.error('Error opening handover modal:', error);
    showAlert('Error opening handover form: ' + error.message, 'danger');
  }
}

function closeHandoverModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('handoverModal'));
  if (modal) modal.hide();
}

// Helper functions for modals
async function loadDonorsForSelect() {
  try {
    const snapshot = await db.collection('donors').orderBy('name').get();
    const select = document.getElementById('donorSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Donor</option>';
    snapshot.forEach(doc => {
      const donor = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${donor.name} (${donor.bloodGroup})`;
      option.dataset.bloodGroup = donor.bloodGroup;
      select.appendChild(option);
    });
    
    // Auto-fill blood group when donor is selected
    select.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      const bloodGroupInput = document.getElementById('donationBloodGroup');
      if (bloodGroupInput && selectedOption.dataset.bloodGroup) {
        bloodGroupInput.value = selectedOption.dataset.bloodGroup;
      }
    });
  } catch (error) {
    console.error('Error loading donors for select:', error);
  }
}

// Enhanced loadApprovedRequestsForSelect to show only requests with available blood
async function loadApprovedRequestsForSelect() {
  try {
    console.log('Loading approved requests for select...');
    
    const select = document.getElementById('requestSelect');
    if (!select) {
      console.error('Request select element not found');
      showAlert('Handover form not properly loaded', 'danger');
      return;
    }
    
    // Clear existing options
    select.innerHTML = '<option value="">Loading...</option>';
    
    // Get approved requests
    const snapshot = await db.collection('requests')
      .where('status', '==', 'Approved')
      .get();
    
    console.log('Found approved requests:', snapshot.size);
    
    // Reset options
    select.innerHTML = '<option value="">Select Approved Request</option>';
    
    if (snapshot.empty) {
      console.log('No approved requests found');
      select.innerHTML = '<option value="">No approved requests available</option>';
      showAlert('No approved requests found. Please approve some blood requests first.', 'info');
      return;
    }
    
    // Convert to array and sort by creation date if available
    const requests = [];
    const requestsWithAvailableBlood = [];
    
    for (const doc of snapshot.docs) {
      const request = doc.data();
      const requestItem = { id: doc.id, ...request };
      requests.push(requestItem);
      
      // Check if blood is available for this request
      const isAvailable = await checkBloodAvailability(request.bloodGroup, request.units);
      if (isAvailable) {
        requestsWithAvailableBlood.push(requestItem);
      }
    }
    
    // Sort by createdAt if available
    requestsWithAvailableBlood.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.seconds : 0;
      const dateB = b.createdAt ? b.createdAt.seconds : 0;
      return dateB - dateA; // Newest first
    });
    
    if (requestsWithAvailableBlood.length === 0) {
      select.innerHTML = '<option value="">No requests with available blood</option>';
      showAlert('No approved requests have sufficient blood available for handover.', 'warning');
      return;
    }
    
    requestsWithAvailableBlood.forEach(request => {
      const option = document.createElement('option');
      option.value = request.id;
      option.textContent = `${request.patientName} - ${request.bloodGroup} (${request.units} units) - ${request.hospital}`;
      select.appendChild(option);
      console.log('Added request option:', option.textContent);
    });
    
    console.log('Successfully loaded', requestsWithAvailableBlood.length, 'approved requests with available blood');
    
  } catch (error) {
    console.error('Error loading approved requests:', error);
    
    const select = document.getElementById('requestSelect');
    if (select) {
      select.innerHTML = '<option value="">Error loading requests</option>';
    }
    
    if (error.code === 'permission-denied') {
      showAlert('Permission denied. Please check your admin privileges.', 'danger');
    } else if (error.code === 'failed-precondition') {
      showAlert('Database index required. Using simplified query...', 'warning');
      // Fallback to simpler query
      try {
        const fallbackSnapshot = await db.collection('requests')
          .where('status', '==', 'Approved')
          .limit(20)
          .get();
        
        const select = document.getElementById('requestSelect');
        if (select) {
          select.innerHTML = '<option value="">Select Approved Request</option>';
          
          // Process fallback requests without availability check for performance
          fallbackSnapshot.forEach(doc => {
            const request = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${request.patientName} - ${request.bloodGroup} (${request.units} units) - ${request.hospital}`;
            select.appendChild(option);
          });
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        showAlert('Error loading approved requests: ' + fallbackError.message, 'danger');
      }
    } else {
      showAlert('Error loading approved requests: ' + error.message, 'danger');
    }
  }
}

function editDonor(id) {
  if (!id) {
    showAlert('Invalid donor ID', 'danger');
    return;
  }
  
  console.log('Editing donor:', id);
  
  // Fetch donor data
  db.collection('donors').doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        showAlert('Donor not found', 'danger');
        return;
      }
      
      const donor = doc.data();
      
      // Populate edit form
      const form = document.getElementById('donor-form');
      if (!form) {
        showAlert('Donor form not found', 'danger');
        return;
      }
      
      // Fill form with existing data
      form.querySelector('[name="name"]').value = donor.name || '';
      form.querySelector('[name="bloodGroup"]').value = donor.bloodGroup || '';
      form.querySelector('[name="age"]').value = donor.age || '';
      form.querySelector('[name="gender"]').value = donor.gender || 'Male';
      form.querySelector('[name="contact"]').value = donor.contact || '';
      form.querySelector('[name="address"]').value = donor.address || '';
      
      // Store donor ID for update
      form.dataset.editId = id;
      
      // Change form title and button
      const modalTitle = document.querySelector('#donorModal .modal-title');
      if (modalTitle) modalTitle.textContent = 'Edit Donor';
      
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Update Donor';
      
      // Show modal
      showDonorModal();
    })
    .catch(error => {
      console.error('Error fetching donor:', error);
      showAlert('Error loading donor data: ' + error.message, 'danger');
    });
}

function deleteDonor(id) {
  if (!id) {
    showAlert('Invalid donor ID', 'danger');
    return;
  }
  
  if (confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
    console.log('Deleting donor:', id);
    
    db.collection('donors').doc(id).delete()
      .then(() => {
        console.log('Donor deleted successfully');
        showAlert('Donor deleted successfully', 'success');
        loadDonors();
      })
      .catch(error => {
        console.error('Error deleting donor:', error);
        
        if (error.code === 'permission-denied') {
          showAlert('Permission denied. Please check your admin privileges.', 'danger');
        } else {
          showAlert('Error deleting donor: ' + error.message, 'danger');
        }
      });
  }
}

// Export functions for global access
window.login = login;
window.logout = logout;
window.showPage = showPage;
window.showPublicPortal = showPublicPortal;
window.showLoginPage = showLoginPage;
window.addDonor = addDonor;
window.addDonation = addDonation;
window.addRequest = addRequest;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.addHandover = addHandover;
window.registerPublicDonor = registerPublicDonor;
window.submitBloodRequest = submitBloodRequest;
window.showDonorModal = showDonorModal;
window.closeDonorModal = closeDonorModal;
window.showDonationModal = showDonationModal;
window.closeDonationModal = closeDonationModal;
window.showRequestModal = showRequestModal;
window.closeRequestModal = closeRequestModal;
window.showHandoverModal = showHandoverModal;
window.closeHandoverModal = closeHandoverModal;
window.editDonor = editDonor;
window.deleteDonor = deleteDonor;
window.editDonation = editDonation;
window.deleteDonation = deleteDonation;
window.editRequest = editRequest;
window.deleteRequest = deleteRequest;
// Helper function to quickly create approved requests for testing handover
window.createApprovedRequests = async function() {
  try {
    if (!currentUser) {
      showAlert('Please login first', 'warning');
      return;
    }
    
    console.log('Creating approved requests for handover testing...');
    
    const approvedRequests = [
      {
        patientName: 'Emma Johnson',
        bloodGroup: 'O+',
        hospital: 'Emergency Medical Center',
        contact: '9876543220',
        units: 2,
        status: 'Approved',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      },
      {
        patientName: 'Michael Brown',
        bloodGroup: 'A+',
        hospital: 'City Hospital',
        contact: '9876543221',
        units: 1,
        status: 'Approved',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      },
      {
        patientName: 'Sarah Davis',
        bloodGroup: 'B+',
        hospital: 'General Hospital',
        contact: '9876543222',
        units: 3,
        status: 'Approved',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      }
    ];
    
    for (const request of approvedRequests) {
      const docRef = await db.collection('requests').add(request);
      console.log('Added approved request:', docRef.id, request.patientName);
    }
    
    showAlert('Approved requests created successfully! You can now test handover functionality.', 'success');
    
    // Reload requests if on requests page
    if (currentPage === 'requests') {
      loadRequests();
    }
    
  } catch (error) {
    console.error('Error creating approved requests:', error);
    showAlert('Error creating approved requests: ' + error.message, 'danger');
  }
};

// Helper function to quickly create sample data for dashboard
window.createSampleDashboardData = async function() {
  try {
    if (!currentUser) {
      showAlert('Please login first', 'warning');
      return;
    }
    
    console.log('Creating sample dashboard data...');
    
    // Create sample donors
    const sampleDonors = [
      { name: 'John Smith', bloodGroup: 'O+', age: 25, gender: 'Male', contact: '9876543210', address: 'City Center' },
      { name: 'Alice Johnson', bloodGroup: 'A+', age: 28, gender: 'Female', contact: '9876543211', address: 'Downtown' },
      { name: 'Bob Wilson', bloodGroup: 'B+', age: 32, gender: 'Male', contact: '9876543212', address: 'Uptown' },
      { name: 'Sarah Davis', bloodGroup: 'AB+', age: 29, gender: 'Female', contact: '9876543213', address: 'Suburb' },
      { name: 'Mike Brown', bloodGroup: 'O-', age: 35, gender: 'Male', contact: '9876543214', address: 'East Side' },
      { name: 'Emily Taylor', bloodGroup: 'A-', age: 26, gender: 'Female', contact: '9876543215', address: 'West End' }
    ];
    
    const donorIds = [];
    
    for (const donor of sampleDonors) {
      const donorData = {
        ...donor,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'admin'
      };
      
      const docRef = await db.collection('donors').add(donorData);
      donorIds.push({ id: docRef.id, bloodGroup: donor.bloodGroup });
      console.log('Added donor:', donor.name);
    }
    
    // Create sample donations over the last few days
    const donations = [
      { donorIndex: 0, units: 1, days: 1 },
      { donorIndex: 1, units: 2, days: 2 },
      { donorIndex: 2, units: 1, days: 3 },
      { donorIndex: 3, units: 1, days: 1 },
      { donorIndex: 4, units: 2, days: 4 },
      { donorIndex: 5, units: 1, days: 2 }
    ];
    
    for (const donation of donations) {
      const donorInfo = donorIds[donation.donorIndex];
      const donationDate = new Date();
      donationDate.setDate(donationDate.getDate() - donation.days);
      
      const donationData = {
        donorId: donorInfo.id,
        bloodGroup: donorInfo.bloodGroup,
        date: donationDate,
        units: donation.units,
        notes: 'Sample donation record',
        createdAt: firebase.firestore.Timestamp.fromDate(donationDate)
      };
      
      await db.collection('donations').add(donationData);
      console.log('Added donation for donor:', donorInfo.id);
    }
    
    showAlert('Sample dashboard data created successfully! Refresh the dashboard to see charts.', 'success');
    
    // Reload dashboard if we're on it
    if (currentPage === 'dashboard') {
      setTimeout(() => {
        loadDashboard();
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error creating sample dashboard data:', error);
    showAlert('Error creating sample data: ' + error.message, 'danger');
  }
};

window.createSampleRequests = createSampleRequests;
window.createApprovedRequests = createApprovedRequests;
window.createSampleDashboardData = createSampleDashboardData;