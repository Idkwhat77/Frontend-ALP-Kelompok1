// Company Profile Management Script - Similar to profile.js

class CompanyProfileManager {
    constructor() {
        this.currentCompany = null;
        this.isOwnProfile = false;
        this.employeesManager = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCompanyProfile();
            this.setupEventListeners();
            this.initializeProvinceCityHandling();
            
            // Initialize employees manager AFTER company data is loaded
            if (this.currentCompany) {
                this.initializeEmployeesManager();
            }
        } catch (error) {
            console.error('Failed to initialize company profile:', error);
            this.showNotification('Failed to load company profile', 'error');
        }
    }

    // Notification system - consistent with other classes in the codebase
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${iconClass} mr-2" aria-label="${type}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    initializeEmployeesManager() {
        // Make sure company data is available globally
        window.currentCompanyData = this.currentCompany;
        
        // Initialize employees manager with company data
        if (typeof CompanyEmployeesManager !== 'undefined') {
            this.employeesManager = new CompanyEmployeesManager(this.currentCompany.id);
            this.employeesManager.isOwnProfile = this.isOwnProfile;
            console.log('Employees manager initialized with company data');
        }
    }

    async loadCompanyProfile() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const companyId = urlParams.get('id');
            const currentUser = window.apiClient.getCurrentUser();

            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }
            
            let response;
            // If there's an ID in the URL, fetch by company ID. Otherwise, fetch by the current user's ID.
            if (companyId) {
                response = await window.apiClient.getCompanyById(companyId);
            } else {
                response = await window.apiClient.getCompanyByUserId(currentUser.id);
            }

            if (response && response.success && response.company) {
                this.currentCompany = response.company;
                window.currentCompanyData = this.currentCompany; // Set globally
                
                // Correctly determine if the profile being viewed is the user's own.
                this.isOwnProfile = this.currentCompany.user?.id === currentUser.id;
                
                this.displayCompanyProfile(this.currentCompany);
                this.toggleEditControls();
            } else {
                throw new Error('Company not found');
            }
        } catch (error) {
            console.error('Error loading company profile:', error);
            this.showNotification('Failed to load company profile', 'error');
        }
    }

    displayCompanyProfile(company) {
        this.currentCompany = company;
        
        // Format province name helper
        const formatProvinceName = (province) => {
            if (!province) return '';
            return province
                .split('-')
                .map(word => {
                    if (word === 'dki') return 'DKI';
                    if (word === 'di') return 'DI';
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        };

        // Format location for display
        const formatLocation = (city, province) => {
            const formattedProvince = formatProvinceName(province);
            if (city && formattedProvince) {
                return `${city}, ${formattedProvince}`;
            } else if (city) {
                return city;
            } else if (formattedProvince) {
                return formattedProvince;
            }
            return 'Not specified';
        };

        // Update company name and basic info
        this.updateElement('company-name', company.companyName);
        this.updateElement('company-name-header', company.companyName);
        this.updateElement('company-industry', company.industry);
        this.updateElement('company-size', `${company.companySize} Employees`);
        this.updateElement('company-size2', company.companySize || 'Not specified');
        this.updateElement('company-foundation-date', this.formatDate(company.foundationDate));
        this.updateElement('company-hq', company.hq);
        this.updateElement('company-email', company.email);
        this.updateElement('company-website', company.websiteUrl || 'Not specified');

        // Add formatted location display
        this.updateElement('company-location', formatLocation(company.city, company.province));
        
        // Update company description
        const descriptionElement = document.getElementById('company-description');
        if (descriptionElement) {
            if (company.description && company.description.trim()) {
                descriptionElement.textContent = company.description;
            } else {
                descriptionElement.innerHTML = `
                    <span class="text-gray-400 dark:text-gray-500 italic">
                        <i class="fas fa-info-circle mr-2"></i>
                        No company description provided
                    </span>
                `;
            }
        }

        // Update company profile image
        this.updateCompanyImage(company);

        // Set company context for image upload
        if (typeof setCompanyContext === 'function') {
            setCompanyContext(company.id, this.isOwnProfile);
        }

        // Update page title
        document.title = `${company.companyName} - RuangKerja`;

        // Initialize employees manager after company data is loaded
        if (typeof CompanyEmployeesManager !== 'undefined') {
            this.employeesManager = new CompanyEmployeesManager(company.id);
        }

        // Show/hide edit controls based on ownership
        this.toggleEditControls();
    }

    updateCompanyImage(company) {
        const profileImageElement = document.getElementById('company-profile-image');
        const imageUrl = company.profileImageUrl 
            ? `http://localhost:8080${company.profileImageUrl}`
            : 'img/default-profile.png';

        if (profileImageElement) {
            profileImageElement.style.backgroundImage = `url('${imageUrl}')`;
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && value) {
            element.textContent = value;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (error) {
            return dateString;
        }
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    setupEventListeners() {
        // Settings form handling
        const settingsForm = document.getElementById('company-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
            
            // Load current profile data when settings modal opens
            const settingsModal = document.getElementById('modal-settings');
            if (settingsModal) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            if (!settingsModal.classList.contains('hidden')) {
                                this.loadCurrentCompanyData();
                            }
                        }
                    });
                });
                observer.observe(settingsModal, { attributes: true });
            }
        }
    }

    // Load current company data into the settings form
    loadCurrentCompanyData() {
        if (!this.currentCompany) return;

        // Populate form fields
        document.getElementById('settings-company-name').value = this.currentCompany.companyName || '';
        document.getElementById('settings-company-email').value = this.currentCompany.email || '';
        document.getElementById('settings-company-industry').value = this.currentCompany.industry || '';
        document.getElementById('settings-company-size').value = this.currentCompany.companySize || '';
        document.getElementById('settings-company-hq').value = this.currentCompany.hq || '';
        document.getElementById('settings-foundation-date').value = this.formatDateForInput(this.currentCompany.foundationDate);
        document.getElementById('settings-company-description').value = this.currentCompany.description || '';
        document.getElementById('settings-company-website').value = this.currentCompany.websiteUrl || '';
        document.getElementById('settings-company-phone').value = this.currentCompany.phoneNumber || '';

        // Handle province and city
        const provinceSelect = document.getElementById('settings-company-province');
        const citySelect = document.getElementById('settings-company-city');
        
        if (provinceSelect && this.currentCompany.province) {
            provinceSelect.value = this.currentCompany.province;
            
            // Trigger change event to populate cities
            const event = new Event('change');
            provinceSelect.dispatchEvent(event);
            
            // Set city after a brief delay to ensure cities are loaded
            setTimeout(() => {
                if (citySelect && this.currentCompany.city) {
                    citySelect.value = this.currentCompany.city;
                }
            }, 100);
        }
    }

    async handleSettingsSubmit(event) {
        event.preventDefault();

        if (!this.currentCompany || !this.isOwnProfile) {
            this.showNotification('You can only edit your own company profile', 'error');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        try {
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

            // Collect form data
            const formData = {
                companyName: document.getElementById('settings-company-name').value.trim(),
                email: document.getElementById('settings-company-email').value.trim(),
                industry: document.getElementById('settings-company-industry').value,
                companySize: document.getElementById('settings-company-size').value,
                hq: document.getElementById('settings-company-hq').value.trim(),
                province: document.getElementById('settings-company-province').value || null,
                city: document.getElementById('settings-company-city').value || null,
                foundationDate: document.getElementById('settings-foundation-date').value,
                description: document.getElementById('settings-company-description').value.trim(),
                websiteUrl: document.getElementById('settings-company-website').value.trim() || null,
                phoneNumber: document.getElementById('settings-company-phone').value.trim() || null
            };

            // Validate required fields
            if (!formData.companyName || !formData.email) {
                throw new Error('Company name and email are required');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                throw new Error('Please enter a valid email address');
            }

            // Update company via API
            if (window.apiClient && window.apiClient.updateCompany) {
                const response = await window.apiClient.updateCompany(this.currentCompany.id, formData);
                
                if (response && response.success) {
                    this.showNotification('Company profile updated successfully!', 'success');
                    
                    // Update the current company data
                    this.currentCompany = { ...this.currentCompany, ...formData };
                    
                    // Update the profile display
                    this.displayCompanyProfile(this.currentCompany);
                    
                    // Close the modal
                    closeModal('modal-settings');
                } else {
                    throw new Error(response?.message || 'Update failed');
                }
            } else {
                // Fallback: simulate update for demo
                setTimeout(() => {
                    this.showNotification('Company profile updated successfully! (Demo mode)', 'success');
                    this.currentCompany = { ...this.currentCompany, ...formData };
                    this.displayCompanyProfile(this.currentCompany);
                    closeModal('modal-settings');
                }, 1000);
            }
            
        } catch (error) {
            console.error('Settings update error:', error);
            this.showNotification(`Error updating company profile: ${error.message}`, 'error');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    // Add province-city handling in company profile settings
    initializeProvinceCityHandling() {
        // Define the same province-city mapping locally
        const companyProvinceCityMap = {
            "aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam", "Aceh Barat", "Aceh Barat Daya", "Aceh Besar", "Aceh Jaya", "Aceh Selatan", "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur", "Aceh Utara", "Bener Meriah", "Bireuen", "Gayo Lues", "Nagan Raya", "Pidie", "Pidie Jaya", "Simeulue"],
            "sumatra-utara": ["Binjai", "Gunungsitoli", "Medan", "Padangsidempuan", "Pematangsiantar", "Sibolga", "Tanjung Balai", "Tebing Tinggi", "Asahan", "Batu Bara", "Dairi", "Deli Serdang", "Humbang Hasundutan", "Karo", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara", "Langkat", "Mandailing Natal", "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Padang Lawas", "Padang Lawas Utara", "Pakpak Bharat", "Samosir", "Serdang Bedagai", "Simalungun", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara", "Toba"],
            "sumatra-barat": ["Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok", "Agam", "Dharmasraya", "Kepulauan Mentawai", "Lima Puluh Kota", "Padang Pariaman", "Pasaman", "Pasaman Barat", "Pesisir Selatan", "Sijunjung", "Solok", "Solok Selatan", "Tanah Datar"],
            "riau": ["Pekanbaru", "Dumai", "Bengkalis", "Indragiri Hilir", "Indragiri Hulu", "Kampar", "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan", "Rokan Hilir", "Rokan Hulu", "Siak"],
            "jambi": ["Jambi", "Sungai Penuh", "Batanghari", "Bungo", "Kerinci", "Merangin", "Muaro Jambi", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo"],
            "sumatra-selatan": ["Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih", "Banyuasin", "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin", "Musi Rawas", "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur", "Penukal Abab Lematang Ilir"],
            "bengkulu": ["Bengkulu", "Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Kaur", "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma"],
            "lampung": ["Bandar Lampung", "Metro", "Lampung Barat", "Lampung Selatan", "Lampung Tengah", "Lampung Timur", "Lampung Utara", "Mesuji", "Pesawaran", "Pesisir Barat", "Pringsewu", "Tulang Bawang", "Tulang Bawang Barat", "Tanggamus", "Way Kanan"],
            "kepulauan-bangka-belitung": ["Pangkal Pinang", "Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah", "Belitung", "Belitung Timur"],
            "kepulauan-riau": ["Batam", "Tanjung Pinang", "Bintan", "Karimun", "Kepulauan Anambas", "Lingga", "Natuna"],
            "dki-jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
            "jawa-barat": ["Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Bandung", "Bandung Barat", "Bekasi", "Bogor", "Ciamis", "Cianjur", "Cirebon", "Garut", "Indramayu", "Karawang", "Kuningan", "Majalengka", "Pangandaran", "Purwakarta", "Subang", "Sukabumi", "Sumedang", "Tasikmalaya"],
            "jawa-tengah": ["Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal", "Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", "Cilacap", "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", "Kendal", "Klaten", "Kudus", "Magelang", "Pati", "Pekalongan", "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Semarang", "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri", "Wonosobo"],
            "di-yogyakarta": ["Yogyakarta", "Bantul", "Gunungkidul", "Kulon Progo", "Sleman"],
            "jawa-timur": ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya", "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", "Jombang", "Kediri", "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"],
            "banten": ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan", "Lebak", "Pandeglang", "Serang", "Tangerang"],
            "bali": ["Denpasar", "Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan"],
            "nusa-tenggara-barat": ["Bima", "Mataram", "Bima", "Dompu", "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Lombok Utara", "Sumbawa", "Sumbawa Barat"],
            "nusa-tenggara-timur": ["Kupang", "Alor", "Belu", "Ende", "Flores Timur", "Kupang", "Lembata", "Malaka", "Manggarai", "Manggarai Barat", "Manggarai Timur", "Ngada", "Nagekeo", "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat", "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur", "Timor Tengah Selatan", "Timor Tengah Utara"],
            "kalimantan-barat": ["Pontianak", "Singkawang", "Bengkayang", "Kapuas Hulu", "Kayong Utara", "Ketapang", "Kubu Raya", "Landak", "Melawi", "Mempawah", "Sambas", "Sanggau", "Sekadau", "Sintang"],
            "kalimantan-tengah": ["Palangka Raya", "Barito Selatan", "Barito Timur", "Barito Utara", "Gunung Mas", "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur", "Lamandau", "Murung Raya", "Pulang Pisau", "Sukamara", "Seruyan"],
            "kalimantan-selatan": ["Banjarbaru", "Banjarmasin", "Balangan", "Banjar", "Barito Kuala", "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara", "Kotabaru", "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin"],
            "kalimantan-timur": ["Balikpapan", "Bontang", "Samarinda", "Berau", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Mahakam Ulu", "Paser", "Penajam Paser Utara"],
            "kalimantan-utara": ["Tarakan", "Bulungan", "Malinau", "Nunukan", "Tana Tidung"],
            "sulawesi-utara": ["Bitung", "Kotamobagu", "Manado", "Tomohon", "Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara", "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro", "Kepulauan Talaud", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara"],
            "sulawesi-tengah": ["Palu", "Banggai", "Banggai Kepulauan", "Banggai Laut", "Buol", "Donggala", "Morowali", "Morowali Utara", "Parigi Moutong", "Poso", "Sigi", "Tojo Una-Una", "Toli-Toli"],
            "sulawesi-selatan": ["Makassar", "Palopo", "Parepare", "Bantaeng", "Barru", "Bone", "Bulukumba", "Enrekang", "Gowa", "Jeneponto", "Kepulauan Selayar", "Luwu", "Luwu Timur", "Luwu Utara", "Maros", "Pangkajene dan Kepulauan", "Pinrang", "Sidenreng Rappang", "Sinjai", "Soppeng", "Takalar", "Tana Toraja", "Toraja Utara", "Wajo"],
            "sulawesi-tenggara": ["Bau-Bau", "Kendari", "Bombana", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat", "Wakatobi"],
            "gorontalo": ["Gorontalo", "Boalemo", "Bone Bolango", "Gorontalo", "Gorontalo Utara", "Pohuwato"],
            "sulawesi-barat": ["Mamuju", "Majene", "Mamasa", "Mamuju", "Mamuju Tengah", "Mamuju Utara", "Polewali Mandar"],
            "maluku": ["Ambon", "Tual", "Buru", "Buru Selatan", "Kepulauan Aru", "Maluku Barat Daya", "Maluku Tengah", "Maluku Tenggara", "Maluku Tenggara Barat", "Seram Bagian Barat", "Seram Bagian Timur"],
            "maluku-utara": ["Ternate", "Tidore Kepulauan", "Halmahera Barat", "Halmahera Tengah", "Halmahera Utara", "Halmahera Selatan", "Kepulauan Sula", "Halmahera Timur", "Pulau Morotai", "Pulau Taliabu"],
            "papua-barat": ["Fakfak", "Kaimana", "Manokwari", "Manokwari Selatan", "Pegunungan Arfak", "Teluk Bintuni", "Teluk Wondama"],
            "papua-barat-daya": ["Sorong", "Raja Ampat", "Sorong", "Sorong Selatan", "Maybrat", "Tambrauw"],
            "papua": ["Jayapura", "Biak Numfor", "Jayapura", "Keerom", "Kepulauan Yapen", "Mamberamo Raya", "Sarmi", "Supiori", "Waropen"],
            "papua-selatan": ["Merauke", "Asmat", "Boven Digoel", "Mappi"],
            "papua-tengah": ["Mimika", "Deiyai", "Dogiyai", "Intan Jaya", "Nabire", "Paniai", "Puncak", "Puncak Jaya"],
            "papua-pegunungan": ["Jayawijaya", "Lanny Jaya", "Mamberamo Tengah", "Nduga", "Pegunungan Bintang", "Tolikara", "Yahukimo", "Yalimo"]

        };

        const settingsProvinceSelect = document.getElementById("settings-company-province");
        const settingsCitySelect = document.getElementById("settings-company-city");

        if (settingsProvinceSelect && settingsCitySelect) {
            settingsProvinceSelect.addEventListener("change", () => {
                const selectedProvince = settingsProvinceSelect.value;
                const cities = companyProvinceCityMap[selectedProvince] || [];
                
                // Clear previous options
                settingsCitySelect.innerHTML = '<option value="">Select City</option>';
                
                if (selectedProvince) {
                    // Enable city select
                    settingsCitySelect.disabled = false;
                    
                    // Add cities for selected province
                    cities.forEach(city => {
                        const option = document.createElement("option");
                        option.value = city;
                        option.textContent = city;
                        settingsCitySelect.appendChild(option);
                    });
                } else {
                    // Disable city select if no province selected
                    settingsCitySelect.disabled = true;
                }
            });
        }
    }

    toggleEditControls() {
        const editControls = document.querySelectorAll('.edit-control');
        editControls.forEach(control => {
            if (this.isOwnProfile) {
                control.style.display = 'inline-block';
            } else {
                control.style.display = 'none';
            }
        });

        // Also setup the "add first employee" button
        const addFirstEmployeeBtn = document.getElementById('add-first-employee-btn');
        if (addFirstEmployeeBtn && this.isOwnProfile) {
            addFirstEmployeeBtn.addEventListener('click', () => {
                if (this.employeesManager) {
                    this.employeesManager.showAddEmployeeModal();
                }
            });
        }
    }

    showError(message) {
        // Use the new notification system
        this.showNotification(message, 'error');
    }
}

// Global modal functions - similar to profile.html
function openModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-0', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
        if (main) main.classList.add('opacity-50');
    }, 10);

    // Close modal if clicked outside the box
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(id);
    };
}

function closeModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    setTimeout(() => {
        content.classList.remove('scale-100');
        content.classList.add('scale-0');
        if (main) main.classList.remove('opacity-50');
    }, 10);
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be ready
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Initialize company profile manager
    window.companyProfileManager = new CompanyProfileManager();
    
    // Make employees manager globally accessible after it's created
    const originalDisplayMethod = window.companyProfileManager.displayCompanyProfile;
    window.companyProfileManager.displayCompanyProfile = function(company) {
        originalDisplayMethod.call(this, company);
        if (this.employeesManager) {
            window.companyEmployeesManager = this.employeesManager;
        }
    };
});