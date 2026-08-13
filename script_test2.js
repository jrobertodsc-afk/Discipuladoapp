<script>
    // Global State
    let currentStudentFilter = 'all';
    let currentStudentId = null;
    let qrCodeInstance = null;
    
    document.addEventListener('DOMContentLoaded', () => {
        // Init sidebar nav
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const target = item.getAttribute('data-target');
                document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
                document.getElementById(target).classList.add('active');
                
                document.getElementById('topbar-title').querySelector('h1').innerText = 
                    item.innerText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
                
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('show');
                }
                
                // Triggers
                if (target === 'dashboard') initDashboard();
                if (target === 'alunos') renderStudentsTable();
                if (target === 'professores') renderTeachersTable();
                if (target === 'frequencia') initAttendance();
                if (target === 'licoes') renderLessons('cycle1');
                if (target === 'atividades') renderActivities();
                if (target === 'mensagens') initMessages();
                if (target === 'qrcodes') generateQRCode();
                if (target === 'certificados') initCertificates();
                if (target === 'configuracoes') initConfig();
            });
        });
        
        // Mobile toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });
        
        // Setup Date
        const dateOpt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date-display').innerText = new Date().toLocaleDateString('pt-BR', dateOpt);
        
        // Initial setup
        initDashboard();
        generateQRCode();
    });
    
    // --- DASHBOARD ---
    function initDashboard() {
        if (typeof StudentManager === 'undefined') return;
        
        const all = StudentManager.getAll();
        const active = StudentManager.getActive();
        const graduated = StudentManager.getGraduated();
        const absent = StudentManager.getAbsentStudents ? StudentManager.getAbsentStudents() : [];
        
        document.getElementById('stat-total').innerText = all.length;
        document.getElementById('stat-active').innerText = active.length;
        document.getElementById('stat-graduated').innerText = graduated.length;
        document.getElementById('stat-absent').innerText = absent.length;
        
        // Recent Activity
        const recentList = document.getElementById('recent-activity-list');
        recentList.innerHTML = '';
        const recent = [...all].sort((a,b) => new Date(b.registrationDate) - new Date(a.registrationDate)).slice(0,5);
        if(recent.length === 0) {
            recentList.innerHTML = '<p class="empty-state" style="padding:16px;">Nenhum aluno registrado.</p>';
        } else {
            recent.forEach(s => {
                const dateStr = window.timeAgo ? timeAgo(s.registrationDate) : new Date(s.registrationDate).toLocaleDateString();
                recentList.innerHTML += `
                    <div style="padding:12px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                        <span><strong>${s.name}</strong> se cadastrou</span>
                        <span style="color:#888; font-size:0.85rem;">${dateStr}</span>
                    </div>
                `;
            });
        }
        
        // Birthdays
        const bdaysList = document.getElementById('birthdays-list');
        bdaysList.innerHTML = '';
        const bdays = StudentManager.getBirthdays ? StudentManager.getBirthdays(new Date().getMonth() + 1) : [];
        if(bdays.length === 0) {
            bdaysList.innerHTML = '<p class="empty-state" style="padding:16px;">Nenhum aniversariante neste mês.</p>';
        } else {
            bdays.forEach(s => {
                const d = new Date(s.birthDate + 'T12:00:00');
                bdaysList.innerHTML += `
                    <div style="padding:12px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                        <span>🎂 <strong>${s.name}</strong></span>
                        <span style="color:#888; font-size:0.85rem;">Dia ${d.getDate()}</span>
                    </div>
                `;
            });
        }
        
        // Charts
        initChart(all);
        initRetentionChart(active.length, all.filter(s=>s.status==='inativo').length, graduated.length);
        initAttendanceChart();
    }
    
    let dashboardChart = null;
    let retentionChart = null;
    let attendanceChartObj = null;
    
    function initChart(students) {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;
        if (dashboardChart) dashboardChart.destroy();
        
        // Group by month
        const months = {};
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        
        students.forEach(s => {
            const d = new Date(s.registrationDate);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            months[key] = (months[key] || 0) + 1;
        });
        
        const labels = Object.keys(months).slice(-6);
        const data = labels.map(l => months[l]);
        
        dashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    label: 'Novos Alunos',
                    data: data.length ? data : [0],
                    borderColor: '#D4A843',
                    backgroundColor: 'rgba(212, 168, 67, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function initRetentionChart(activeCount, inactiveCount, graduatedCount) {
        const ctx = document.getElementById('retentionChart');
        if (!ctx) return;
        if (retentionChart) retentionChart.destroy();
        
        retentionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Inativos', 'Formados'],
                datasets: [{
                    data: [activeCount, inactiveCount, graduatedCount],
                    backgroundColor: ['#1e8e3e', '#d93025', '#D4A843'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function initAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;
        if (attendanceChartObj) attendanceChartObj.destroy();
        
        if (typeof AttendanceManager === 'undefined') return;
        const allAttArray = DB ? DB.getAll(DB.KEYS.ATTENDANCE) : [];
        const allAtt = {};
        allAttArray.forEach(a => {
            if(!allAtt[a.date]) allAtt[a.date] = {};
            allAtt[a.date][a.studentId] = a.present;
        });
        const dates = Object.keys(allAtt).sort().slice(-5); // last 5 meetings
        
        const labels = [];
        const data = [];
        
        dates.forEach(d => {
            const dateObj = new Date(d + 'T12:00:00');
            labels.push(dateObj.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}));
            
            const recs = Object.values(allAtt[d]);
            const pres = recs.filter(v => v === true).length;
            const total = recs.length || 1;
            data.push(Math.round((pres/total)*100));
        });

        attendanceChartObj = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    label: 'Média (%)',
                    data: data.length ? data : [0],
                    backgroundColor: '#1a237e',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    // --- ALUNOS ---
    function setStudentFilter(filter, btnElement) {
        currentStudentFilter = filter;
        document.querySelectorAll('.filter-bar .btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        renderStudentsTable();
    }
    
    function renderStudentsTable() {
        if (typeof StudentManager === 'undefined') return;
        const tbody = document.getElementById('students-table-body');
        const searchTerm = document.getElementById('student-search').value.toLowerCase();
        
        let students = StudentManager.getAll();
        
        if (currentStudentFilter === 'active') students = StudentManager.getActive();
        if (currentStudentFilter === 'graduated') students = StudentManager.getGraduated();
        if (currentStudentFilter === 'inactive') students = students.filter(s => s.status === 'inativo');
        
        if (searchTerm) {
            students = students.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                s.phone.includes(searchTerm)
            );
        }
        
        tbody.innerHTML = '';
        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum aluno encontrado.</td></tr>`;
            return;
        }
        
        students.forEach(s => {
            const progress = s.progress ? s.progress.c1.length : 0;
            const progressPct = (progress / 13) * 100;
            const attData = typeof AttendanceManager !== 'undefined' ? AttendanceManager.getByStudent(s.id) : [];
            const attPct = attData.length ? Math.round((attData.filter(a=>a.present).length / attData.length)*100) : 0;
            
            let statusClass = s.status === 'ativo' ? 'active' : (s.status === 'formado' ? 'graduated' : 'inactive');
            let statusText = s.status.charAt(0).toUpperCase() + s.status.slice(1);
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.phone}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div style="font-size:0.75rem;">${progress}/13</div>
                        <div class="progress-wrapper"><div class="progress-fill" style="width:${progressPct}%"></div></div>
                    </td>
                    <td>${attPct}% freq.</td>
                    <td>
                        <button class="action-btn" title="Ver Detalhes" onclick="openStudentModal('${s.id}')">👁️</button>
                        <button class="action-btn whatsapp" title="WhatsApp" onclick="window.open('https://wa.me/${s.phone.replace(/\D/g,'')}', '_blank')"><i class="bx bxl-whatsapp"></i>💬</button>
                    </td>
                </tr>
            `;
        });
    }

    function openStudentModal(id) {
        currentStudentId = id;
        const s = StudentManager.getById(id);
        if(!s) return;
        
        document.getElementById('modal-student-name').innerText = s.name;
        
        let statusClass = s.status === 'ativo' ? 'active' : (s.status === 'formado' ? 'graduated' : 'inactive');
        const badge = document.getElementById('modal-student-status');
        badge.className = `badge ${statusClass}`;
        badge.innerText = s.status.toUpperCase();
        
        document.getElementById('modal-student-date').innerText = new Date(s.registrationDate).toLocaleDateString('pt-BR');
        
        const prog = s.progress ? s.progress.c1.length : 0;
        document.getElementById('modal-progress-c1-text').innerText = `${prog}/13`;
        document.getElementById('modal-progress-c1-bar').style.width = `${(prog/13)*100}%`;
        
        renderStudentNotes();
        openModal('student-modal');
    }
    
    function changeStudentStatus(status) {
        if(!currentStudentId) return;
        StudentManager.updateStatus(currentStudentId, status);
        openStudentModal(currentStudentId);
        renderStudentsTable();
        if(window.showToast) showToast('Status atualizado.');
    }
    
    function deleteStudent() {
        if(!currentStudentId) return;
        if(confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
            StudentManager.deleteStudent(currentStudentId);
            closeModal('student-modal');
            renderStudentsTable();
            if(window.showToast) showToast('Aluno excluído.');
        }
    }
    
    function renderStudentNotes() {
        if(typeof NotesManager === 'undefined' || !currentStudentId) return;
        const notes = NotesManager.getByStudent(currentStudentId);
        const container = document.getElementById('modal-notes-list');
        container.innerHTML = '';
        
        if(notes.length === 0) {
            container.innerHTML = '<p style="color:#888;">Nenhuma nota registrada.</p>';
        } else {
            notes.forEach(n => {
                container.innerHTML += `
                    <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <small style="color:#888;">${new Date(n.date).toLocaleString('pt-BR')}</small>
                            <button class="action-btn delete" style="padding:0; font-size:1rem;" onclick="deleteNote('${n.id}')">🗑️</button>
                        </div>
                        <div>${n.text}</div>
                    </div>
                `;
            });
        }
    }
    
    function addStudentNote() {
        const text = document.getElementById('modal-student-note').value;
        if(!text.trim() || !currentStudentId) return;
        NotesManager.add(currentStudentId, text);
        document.getElementById('modal-student-note').value = '';
        renderStudentNotes();
    }
    function deleteNote(noteId) {
        if(confirm('Excluir nota?')) {
            NotesManager.delete(noteId);
            renderStudentNotes();
        }
    }
    
    function handleAdminCadastro(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('cad-nome').value,
            phone: document.getElementById('cad-telefone').value,
            birthDate: document.getElementById('cad-nascimento').value,
            address: document.getElementById('cad-endereco').value
        };
        StudentManager.add(data);
        if(window.showToast) showToast('Aluno cadastrado com sucesso!');
        e.target.reset();
        closeModal('cadastro-modal');
        renderStudentsTable();
        initDashboard();
    }

    // --- FREQUENCIA ---
    function initAttendance() {
        const dateInput = document.getElementById('attendance-date');
        if(!dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
        renderAttendanceList();
    }
    
    function renderAttendanceList() {
        if(typeof AttendanceManager === 'undefined' || typeof StudentManager === 'undefined') return;
        const date = document.getElementById('attendance-date').value;
        const students = StudentManager.getActive();
        const existingArr = AttendanceManager.getByDate(date) || [];
        
        const existing = {};
        existingArr.forEach(a => existing[a.studentId] = a.present);
        
        const container = document.getElementById('attendance-list-container');
        container.innerHTML = '';
        
        if(students.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum aluno ativo no momento.</p>';
            return;
        }
        
        let html = '<table class="data-table"><thead><tr><th>Aluno</th><th>Presente</th></tr></thead><tbody>';
        students.forEach(s => {
            const isPresent = existing[s.id] === true;
            html += `
                <tr>
                    <td>${s.name}</td>
                    <td>
                        <input type="checkbox" class="att-checkbox" data-id="${s.id}" ${isPresent ? 'checked' : ''} style="width:20px; height:20px;">
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    function saveAttendance() {
        const date = document.getElementById('attendance-date').value;
        const checkboxes = document.querySelectorAll('.att-checkbox');
        
        // Remove existing records for this date to prevent duplicates
        const existingArr = AttendanceManager.getByDate(date) || [];
        existingArr.forEach(a => DB.delete(DB.KEYS.ATTENDANCE, a.id));
        
        checkboxes.forEach(cb => {
            const studentId = cb.getAttribute('data-id');
            const present = cb.checked;
            AttendanceManager.record(studentId, date, present);
        });
        
        if(window.showToast) showToast('Frequência salva com sucesso!');
        initDashboard(); // Update absent stats
    }
    
    // --- MENSAGENS ---
    function initMessages() {
        if(typeof StudentManager === 'undefined') return;
        const active = StudentManager.getActive();
        const absent = StudentManager.getAbsentStudents ? StudentManager.getAbsentStudents() : [];
        
        const populateSelect = (id, list) => {
            const sel = document.getElementById(id);
            if(!sel) return;
            sel.innerHTML = '<option value="">Selecione...</option>';
            list.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name}</option>`);
        };
        
        populateSelect('msg-welcome-student', StudentManager.getAll());
        populateSelect('msg-reminder-student', active);
        populateSelect('msg-absent-student', absent);
    }
    
    function sendMsgWelcome() {
        const id = document.getElementById('msg-welcome-student').value;
        if(!id) return alert('Selecione um aluno');
        const s = StudentManager.getById(id);
        const text = window.WhatsAppTemplates ? WhatsAppTemplates.welcome(s.name) : `Olá ${s.name}, bem-vindo(a)!`;
        window.open(`https://wa.me/${s.phone.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
    }
    function sendMsgReminder() {
        const id = document.getElementById('msg-reminder-student').value;
        const topic = document.getElementById('msg-reminder-topic').value || 'nossa próxima aula';
        if(!id) return alert('Selecione um aluno');
        const s = StudentManager.getById(id);
        const text = window.WhatsAppTemplates ? WhatsAppTemplates.reminder(s.name, topic, '', '') : `Olá ${s.name}, lembrete do encontro sobre ${topic}.`;
        window.open(`https://wa.me/${s.phone.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
    }
    function sendMsgAbsent() {
        const id = document.getElementById('msg-absent-student').value;
        if(!id) return alert('Selecione um aluno');
        const s = StudentManager.getById(id);
        const text = window.WhatsAppTemplates ? WhatsAppTemplates.absent(s.name) : `Olá ${s.name}, sentimos sua falta!`;
        window.open(`https://wa.me/${s.phone.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    // --- QR CODES ---
    function generateQRCode() {
        const urlPath = document.getElementById('qr-link-select').value;
        const fullUrl = window.location.origin + window.location.pathname.replace('admin.html', '') + urlPath;
        
        const container = document.getElementById('qrcode-display');
        container.innerHTML = '';
        
        qrCodeInstance = new QRCode(container, {
            text: fullUrl,
            width: 200,
            height: 200,
            colorDark : "#1a237e",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }
    
    function printQRCode() {
        const printContent = document.getElementById('qr-print-area').innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`
            <html><head><title>Print QR Code</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; }
                .card { border: 2px solid #D4A843; padding: 32px; border-radius: 16px; display: inline-block; }
            </style>
            </head><body><div class="card">${printContent}</div>
            <script>window.onload=()=>{window.print();window.close();}</script></body></html>
        `);
        w.document.close();
    }
    
    function downloadQRCode() {
        html2canvas(document.getElementById('qr-print-area')).then(canvas => {
            const link = document.createElement('a');
            link.download = 'qrcode_discipulado.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
    
    // --- CERTIFICADOS ---
    function initCertificates() {
        if(typeof StudentManager === 'undefined') return;
        const sel = document.getElementById('cert-student-select');
        sel.innerHTML = '<option value="">Selecione...</option>';
        
        // Find eligible (13 lessons completed in c1 or c2)
        const eligible = StudentManager.getAll().filter(s => 
            (s.progress && s.progress.c1 && s.progress.c1.length === 13) || 
            (s.progress && s.progress.c2 && s.progress.c2.length === 13) ||
            s.status === 'formado'
        );
        
        eligible.forEach(s => {
            sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
    }
    
    function generateCertificate() {
        const id = document.getElementById('cert-student-select').value;
        if(!id) return alert('Selecione um aluno');
        const s = StudentManager.getById(id);
        const cycle = document.getElementById('cert-cycle-select').value;
        const churchName = window.DB ? (DB.getSettings().churchName || 'AD CML CAB') : 'AD CML CAB';
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // Background and border
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 297, 210, 'F');
        
        doc.setDrawColor(212, 168, 67); // Gold
        doc.setLineWidth(5);
        doc.rect(10, 10, 277, 190);
        doc.setLineWidth(1);
        doc.rect(12, 12, 273, 186);
        
        // Text
        doc.setTextColor(26, 35, 126); // Blue
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        doc.text("CERTIFICADO", 148, 50, { align: 'center' });
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.text("DE CONCLUSÃO", 148, 65, { align: 'center' });
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(16);
        doc.text("Certificamos que", 148, 90, { align: 'center' });
        
        doc.setTextColor(212, 168, 67);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text(s.name, 148, 110, { align: 'center' });
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const text = `concluiu com êxito o Ciclo ${cycle} do programa de Discipulado da ${churchName}.`;
        doc.text(text, 148, 130, { align: 'center' });
        
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 148, 150, { align: 'center' });
        
        doc.setDrawColor(0,0,0);
        doc.setLineWidth(0.5);
        doc.line(100, 180, 197, 180);
        doc.setFontSize(12);
        doc.text("Assinatura do Pastor/Líder", 148, 186, { align: 'center' });
        
        doc.save(`Certificado_${s.name.replace(/\s+/g,'_')}.pdf`);
    }
    
    // --- EXPORT/BACKUP/CONFIG ---
    function exportStudentsCSV() {
        if(window.ExportManager) ExportManager.exportStudents();
    }
    function exportAttendanceCSV() {
        if(window.ExportManager) ExportManager.exportAttendance();
    }
    
    function downloadBackup() {
        if(window.ExportManager) ExportManager.backupAll();
    }
    
    function restoreBackup() {
        const file = document.getElementById('backup-file').files[0];
        if(!file) return alert('Selecione um arquivo de backup.');
        if(window.ExportManager) {
            ExportManager.restoreBackup(file).then(success => {
                if(success) {
                    alert('Backup restaurado com sucesso! A página será recarregada.');
                    location.reload();
                }
            });
        }
    }
    
    function initConfig() {
        if(window.DB) {
            const s = DB.getSettings();
            document.getElementById('config-church-name').value = s.churchName || '';
            document.getElementById('config-pastor-name').value = s.pastorName || '';
            document.getElementById('config-address').value = s.address || '';
        }
    }
    
    function saveSettings() {
        if(window.DB) {
            DB.saveSettings({
                churchName: document.getElementById('config-church-name').value,
                pastorName: document.getElementById('config-pastor-name').value,
                address: document.getElementById('config-address').value
            });
            if(window.showToast) showToast('Configurações salvas!');
        }
    }
    
    // Modal Utils
    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }
    
    // Close modal on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    }

    // --- PHASE 3: PROFESSORES ---
    function renderTeachersTable() {
        if (typeof TeacherManager === 'undefined') return;
        const tbody = document.getElementById('teachers-table-body');
        const teachers = TeacherManager.getAll();
        tbody.innerHTML = '';
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum professor cadastrado.</td></tr>`;
            return;
        }
        teachers.forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.phone}</td>
                    <td><code>${t.accessCode}</code></td>
                    <td>
                        <button class="action-btn delete" onclick="deleteTeacher('${t.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    function handleTeacherSubmit(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('teacher-name').value,
            phone: document.getElementById('teacher-phone').value
        };
        TeacherManager.add(data);
        if(window.showToast) showToast('Professor cadastrado!');
        e.target.reset();
        closeModal('teacher-modal');
        renderTeachersTable();
    }

    function deleteTeacher(id) {
        if(confirm('Tem certeza que deseja remover este professor?')) {
            TeacherManager.delete(id);
            renderTeachersTable();
            if(window.showToast) showToast('Professor removido.');
        }
    }

    // --- PHASE 3: DISCIPLINAS/LIÇÕES ---
    let currentCycleView = 'cycle1';
    let currentLessonId = null;

    function renderLessons(cycle, btnElement) {
        if(btnElement) {
            document.querySelectorAll('#licoes .filter-bar .btn').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
        }
        currentCycleView = cycle;
        if (typeof LessonManager === 'undefined') return;
        const tbody = document.getElementById('lessons-table-body');
        const lessons = LessonManager.getCycle(cycle);
        tbody.innerHTML = '';
        if (lessons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhuma lição encontrada neste ciclo.</td></tr>`;
            return;
        }
        lessons.forEach(l => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${l.id}</strong></td>
                    <td><span class="badge active">${l.theme}</span></td>
                    <td>${l.title}</td>
                    <td>
                        <button class="action-btn" onclick="editLesson('${cycle}', '${l.id}')">✏️</button>
                    </td>
                </tr>
            `;
        });
    }

    function editLesson(cycle, id) {
        currentLessonId = id;
        const lesson = LessonManager.getCycle(cycle).find(l => l.id === id);
        if(!lesson) return;
        document.getElementById('lesson-cycle').value = cycle;
        document.getElementById('lesson-title').value = lesson.title;
        document.getElementById('lesson-theme').value = lesson.theme;
        document.getElementById('lesson-verses').value = lesson.verses || '';
        document.getElementById('lesson-summary').value = lesson.summary || '';
        openModal('lesson-modal');
    }

    function handleLessonSubmit(e) {
        e.preventDefault();
        const cycle = document.getElementById('lesson-cycle').value;
        const data = {
            title: document.getElementById('lesson-title').value,
            theme: document.getElementById('lesson-theme').value,
            verses: document.getElementById('lesson-verses').value,
            summary: document.getElementById('lesson-summary').value
        };
        
        if (currentLessonId) {
            data.id = currentLessonId;
            LessonManager.updateLesson(cycle, currentLessonId, data);
            if(window.showToast) showToast('Lição atualizada!');
        } else {
            data.id = 'L' + (LessonManager.getCycle(cycle).length + 1);
            LessonManager.addLesson(cycle, data);
            if(window.showToast) showToast('Lição criada!');
        }
        
        closeModal('lesson-modal');
        renderLessons(currentCycleView);
    }

    // --- PHASE 3: ATIVIDADES ---
    function renderActivities() {
        if (typeof ActivityManager === 'undefined') return;
        const tbody = document.getElementById('activities-table-body');
        const activities = ActivityManager.getAll();
        tbody.innerHTML = '';
        if (activities.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhuma atividade cadastrada.</td></tr>`;
            return;
        }
        activities.forEach(a => {
            const d = new Date(a.date + 'T12:00:00');
            tbody.innerHTML += `
                <tr>
                    <td><strong>${a.title}</strong></td>
                    <td>${d.toLocaleDateString('pt-BR')}</td>
                    <td>${a.description || '-'}</td>
                    <td>
                        <button class="action-btn delete" onclick="deleteActivity('${a.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    function handleActivitySubmit(e) {
        e.preventDefault();
        const data = {
            title: document.getElementById('activity-title').value,
            date: document.getElementById('activity-date').value,
            description: document.getElementById('activity-description').value
        };
        ActivityManager.add(data);
        if(window.showToast) showToast('Atividade cadastrada!');
        e.target.reset();
        closeModal('activity-modal');
        renderActivities();
    }
    
    function deleteActivity(id) {
        if(confirm('Remover atividade?')) {
            ActivityManager.delete(id);
            renderActivities();
        }
    }

    // --- PHASE 3: STUDENT EDIT ---
    function toggleStudentEditMode(edit) {
        document.getElementById('student-view-mode').style.display = edit ? 'none' : 'block';
        document.getElementById('student-edit-mode').style.display = edit ? 'block' : 'none';
        
        if(edit && currentStudentId) {
            const s = StudentManager.getById(currentStudentId);
            document.getElementById('edit-nome').value = s.name;
            document.getElementById('edit-telefone').value = s.phone;
            document.getElementById('edit-nascimento').value = s.birthDate || '';
            document.getElementById('edit-endereco').value = s.address || '';
            
            // Populate teachers dropdown
            const sel = document.getElementById('edit-teacher');
            sel.innerHTML = '<option value="">Nenhum (Sem Professor)</option>';
            if (typeof TeacherManager !== 'undefined') {
                TeacherManager.getAll().forEach(t => {
                    sel.innerHTML += `<option value="${t.id}" ${s.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`;
                });
            }
        }
    }

    function saveStudentEdit(e) {
        e.preventDefault();
        if(!currentStudentId) return;
        const data = {
            name: document.getElementById('edit-nome').value,
            phone: document.getElementById('edit-telefone').value,
