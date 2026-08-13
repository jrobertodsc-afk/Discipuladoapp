>     <script>
          // Toast Notification System
          window.showToast = function(message, type = 'success') {
              let container = document.getElementById('toast-container');
              if (!container) {
                  container = document.createElement('div');
                  container.id = 'toast-container';
                  container.className = 'toast-container';
                  document.body.appendChild(container);
              }
              const toast = document.createElement('div');
              toast.className = `toast toast-${type}`;
              toast.innerHTML = `<div style="display:flex; align-items:center; gap:10px;">
                                     <div>${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</div>
                                     <div>${message}</div>
                                 </div>`;
              container.appendChild(toast);
              setTimeout(() => {
                  toast.classList.add('removing');
                  setTimeout(() => toast.remove(), 300);
              }, 3000);
          };
  
          // Portal State
          let currentStudent = null;
          let currentTeacher = null;
          let currentLessonView = null; // {cycleId, lessonId}
  
          // DOM Elements
          const loginScreen = document.getElementById('login-screen');
          const teacherDashboardScreen = document.getElementById('teacher-dashboard-screen');
          const dashboardScreen = document.getElementById('dashboard-screen');
          const loginForm = document.getElementById('login-form');
          
          // Format Phone input removed since it is not used in login anymore
  
          // Initialize Portal
          document.addEventListener('DOMContentLoaded', async () => {
              // Check auth first
              try {
                  if (window.getCurrentUser) {
                      const authData = await window.getCurrentUser();
                      if (authData && authData.user && authData.userData) {
                          const user = authData.user;
                          const role = authData.userData.role;
                      if (role === 'teacher' || role === 'admin') {
                          const allTeachers = TeacherManager.getAll();
                          let teacher = allTeachers.find(t => t.email === user.email);
                          if (teacher || role === 'admin') {
                              currentTeacher = teacher || { name: 'Admin', role: 'admin' };
                              loginScreen.style.display = 'none';
                              teacherDashboardScreen.style.display = 'flex';
                              updateTeacherDashboard();
                              showToast(`Bem-vindo de volta, ${currentTeacher.name}!`, 'success');
                          }
                      } else if (role === 'student') {
                          const allStudents = StudentManager.getAll();
                          let student = allStudents.find(s => s.email === user.email);
                          if (student) {
                              currentStudent = student;
                              loginScreen.style.display = 'none';
                              dashboardScreen.style.display = 'flex';
                              updateDashboard();
                              showToast(`Bem-vindo de volta, ${student.name.split(' ')[0]}!`, 'success');
                          }
                      }
                  }
              } catch (e) {
                  console.error("Auto-login error", e);
              }
  
              // Setup Tabs
              document.querySelectorAll('.portal-tab').forEach(tab => {
                  tab.addEventListener('click', () => {
                      document.querySelectorAll('.portal-tab').forEach(t => t.classList.remove('active'));
                      document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
                      tab.classList.add('active');
                      document.getElementById(tab.dataset.target).classList.add('active');
                  });
              });
  
              // Setup Cycle Tabs in Lessons
              document.querySelectorAll('.cycle-tab').forEach(tab => {
                  tab.addEventListener('click', () => {
                      document.querySelectorAll('.cycle-tab').forEach(t => t.classList.remove('active'));
                      document.querySelectorAll('.lessons-grid').forEach(g => g.style.display = 'none');
                      tab.classList.add('active');
                      document.getElementById(`lessons-grid-${tab.dataset.cycle}`).style.display = 'grid';
                  });
              });
  
              // Logout Student
              document.getElementById('btn-logout').addEventListener('click', async () => {
                  await window.logoutUser();
                  currentStudent = null;
                  loginScreen.style.display = 'flex';
                  dashboardScreen.style.display = 'none';
                  loginForm.reset();
                  showToast('Você saiu do portal.', 'info');
              });
  
              // Logout Teacher
              document.getElementById('btn-teacher-logout').addEventListener('click', async () => {
                  await window.logoutUser();
                  currentTeacher = null;
                  loginScreen.style.display = 'flex';
                  teacherDashboardScreen.style.display = 'none';
                  loginForm.reset();
                  showToast('Você saiu do portal.', 'info');
              });
  
              // Modal Close
              document.getElementById('close-lesson-modal').addEventListener('click', () => {
                  document.getElementById('lesson-modal').classList.remove('active');
              });
              window.addEventListener('click', (e) => {
                  const modal = document.getElementById('lesson-modal');
                  if (e.target === modal) {
                      modal.classList.remove('active');
                  }
              });
          });
  
          // Helper function
          function formatDate(dateString) {
              if (!dateString) return '--/--/----';
              const d = new Date(dateString);
              if (isNaN(d.getTime())) return '--/--/----';
              return d.toLocaleDateString('pt-BR');
          }
  
          // Handle Login
          loginForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('login-email').value.trim();
              const password = document.getElementById('login-password').value.trim();
  
              if (!email || !password) {
                  showToast('Preencha e-mail e senha.', 'error');
                  return;
              }
  
              try {
                  showToast('Autenticando...', 'info');
                  // Usa a função do auth.js injetada no window
                  const authResult = await window.loginUser(email, password);
                  const { user, role } = authResult;
  
                  if (role === 'teacher' || role === 'admin') {
                      // Find teacher by email
                      const allTeachers = TeacherManager.getAll();
                      let teacher = allTeachers.find(t => t.email === email);
                      
                      if (teacher || role === 'admin') {
                          currentTeacher = teacher || { name: 'Admin', role: 'admin' };
                          showToast(`Bem-vindo, Professor(a) ${currentTeacher.name}!`, 'success');
                          loginScreen.style.display = 'none';
                          teacherDashboardScreen.style.display = 'flex';
                          updateTeacherDashboard();
                      } else {
                          showToast('Perfil de professor não encontrado.', 'error');
                      }
                  } else if (role === 'student') {
                      // Find student by email
                      const allStudents = StudentManager.getAll();
                      let student = allStudents.find(s => s.email === email);
                      
                      if (student) {
                          currentStudent = student;
                          showToast(`Bem-vindo, ${student.name.split(' ')[0]}!`, 'success');
                          loginScreen.style.display = 'none';
                          dashboardScreen.style.display = 'flex';
                          updateDashboard();
                      } else {
                          showToast('Perfil de aluno não encontrado.', 'error');
                      }
                  } else {
                      showToast('Função de usuário desconhecida.', 'error');
                  }
  
              } catch (error) {
                  console.error(error);
                  showToast('E-mail ou senha incorretos.', 'error');
              }
          });
  
          // Update Teacher Dashboard
          function updateTeacherDashboard() {
              if (!currentTeacher) return;
              
              document.getElementById('teacher-welcome-name').innerText = `Olá, Professor(a) ${currentTeacher.name}! 👋`;
              
              // Populate Disciplines
              const discList = document.getElementById('teacher-disciplines-list');
              discList.innerHTML = '';
              if (currentTeacher.disciplines && currentTeacher.disciplines.length > 0) {
                  const allLessons = [...(LessonManager.getCycle('cycle1')||[]), ...(LessonManager.getCycle('cycle2')||[])];
                  currentTeacher.disciplines.forEach(discId => {
                      const lesson = allLessons.find(l => l.id === discId);
                      if (lesson) {
                          discList.innerHTML += `<span class="lesson-badge" style="margin:0; font-size: 0.9rem;">${lesson.icon} ${lesson.title}</span>`;
                      }
                  });
              } else {
                  discList.innerHTML = '<span class="text-light">Nenhuma disciplina atribuída.</span>';
              }
  
              const grid = document.getElementById('teacher-students-grid');
              grid.innerHTML = '';
              
              const allStudents = StudentManager.getAll();
              const myStudents = allStudents.filter(s => s.teacherId === currentTeacher.id);
              
              if (myStudents.length === 0) {
                  grid.innerHTML = '<p class="text-light" style="grid-column: 1/-1;">Você ainda não possui alunos vinculados.</p>';
                  return;
              }
              
              myStudents.forEach(student => {
                  const totalLessons = (LessonManager.getCycle('cycle1')?.length || 13) + (LessonManager.getCycle('cycle2')?.length || 13);
                  const completed = student.completedLessons ? student.completedLessons.length : 0;
                  const progress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
                  
                  const attendances = AttendanceManager.getByStudent(student.id);
                  const attendanceTotal = attendances.length;
                  const presenceCount = attendances.filter(a => a.status === 'present').length;
                  const rate = attendanceTotal > 0 ? Math.round((presenceCount / attendanceTotal) * 100) : 0;
                  
                  const card = document.createElement('div');
                  card.className = 'student-card';
                  // Can be hooked up to show a student profile modal if needed
                  card.innerHTML = `
                      <h4>${student.name}</h4>
                      <p><i class="fa-solid fa-phone"></i> ${student.phone || 'N/A'}</p>
                      <p><i class="fa-solid fa-calendar"></i> Cadastrado em: ${formatDate(student.enrollmentDate)}</p>
                      
                      <div class="student-stats">
                          <div class="stat-item">
                              <div class="stat-value">${progress}%</div>
                              <div class="stat-label">Conclusão</div>
                          </div>
                          <div class="stat-item">
                              <div class="stat-value">${rate}%</div>
                              <div class="stat-label">Presença</div>
                          </div>
                      </div>
                  `;
                  grid.appendChild(card);
              });
          }
  
          // Update Dashboard Data
          function updateDashboard() {
              if (!currentStudent) return;
  
              // 1. Header
              const firstName = currentStudent.name.split(' ')[0];
              document.getElementById('welcome-name').innerText = `Olá, ${firstName}! 👋`;
  
              // 2. Calculate Progress
              const completedIds = currentStudent.completedLessons || [];
              
              let c1Total = 0, c1Completed = 0;
              let c2Total = 0, c2Completed = 0;
  
              // Populate Lessons Grid Cycle 1
              const gridC1 = document.getElementById('lessons-grid-cycle1');
              gridC1.innerHTML = '';
              const cycle1Lessons = LessonManager.getCycle('cycle1') || [];
              cycle1Lessons.forEach(lesson => {
                  c1Total++;
                  const isCompleted = completedIds.includes(lesson.id);
                  if (isCompleted) c1Completed++;
                  gridC1.appendChild(createLessonCard(lesson, isCompleted, 'cycle1'));
              });
  
              // Populate Lessons Grid Cycle 2
              const gridC2 = document.getElementById('lessons-grid-cycle2');
              gridC2.innerHTML = '';
              const cycle2Lessons = LessonManager.getCycle('cycle2') || [];
              cycle2Lessons.forEach(lesson => {
                  c2Total++;
                  const isCompleted = completedIds.includes(lesson.id);
                  if (isCompleted) c2Completed++;
                  gridC2.appendChild(createLessonCard(lesson, isCompleted, 'cycle2'));
              });
  
              const totalLessons = c1Total + c2Total;
              const totalCompleted = c1Completed + c2Completed;
              const overallPercent = totalLessons === 0 ? 0 : Math.round((totalCompleted / totalLessons) * 100);
              const c1Percent = c1Total === 0 ? 0 : Math.round((c1Completed / c1Total) * 100);
              const c2Percent = c2Total === 0 ? 0 : Math.round((c2Completed / c2Total) * 100);
  
              // Update Progress Overview UI
              document.getElementById('header-progress-badge').innerHTML = `<i class="fa-solid fa-trophy"></i> <span>${overallPercent}%</span>`;
              
              const circle = document.getElementById('overall-progress-circle');
              circle.style.background = `conic-gradient(var(--secondary-color) ${overallPercent * 3.6}deg, var(--bg-light) 0deg)`;
              document.getElementById('overall-progress-value').innerText = `${overallPercent}%`;
              document.getElementById('overall-completed-text').innerText = totalCompleted;
  
              document.getElementById('c1-progress-fill').style.width = `${c1Percent}%`;
              document.getElementById('c1-progress-text').innerText = `${c1Percent}%`;
              document.getElementById('c1-completed-text').innerText = c1Completed;
  
              document.getElementById('c2-progress-fill').style.width = `${c2Percent}%`;
              document.getElementById('c2-progress-text').innerText = `${c2Percent}%`;
              document.getElementById('c2-completed-text').innerText = c2Completed;
  
              // Update Certificates Tab
              updateCertificatesTab(c1Completed, c1Total, c2Completed, c2Total);
  
              // Update Profile Tab
              updateProfileTab();
              
              // Update Activities Tab
              updateActivitiesTab();
          }
  
          function updateActivitiesTab() {
              const grid = document.getElementById('activities-grid-container');
              grid.innerHTML = '';
              
              if (typeof ActivityManager === 'undefined') {
                  grid.innerHTML = '<p class="text-light">Módulo de atividades não disponível.</p>';
                  return;
              }
              
              const activities = ActivityManager.getAll();
              // Sort by date (future first)
              activities.sort((a, b) => new Date(a.date) - new Date(b.date));
              
              if (activities.length === 0) {
                  grid.innerHTML = '<p class="text-light" style="grid-column: 1/-1;">Nenhuma atividade agendada no momento.</p>';
                  return;
              }
              
              activities.forEach(activity => {
                  const card = document.createElement('div');
                  card.className = 'activity-card';
                  card.innerHTML = `
                      <div class="activity-date"><i class="fa-regular fa-calendar"></i> ${formatDate(activity.date)}</div>
                      <h4 class="activity-title">${activity.title}</h4>
                      <p class="activity-desc">${activity.description}</p>
                      <div class="activity-type">${activity.type || 'Evento'}</div>
                  `;
                  grid.appendChild(card);
              });
          }
  
          function createLessonCard(lesson, isCompleted, cycleId) {
              const div = document.createElement('div');
              div.className = `lesson-card ${isCompleted ? 'completed' : ''}`;
              div.onclick = () => openLessonModal(lesson, isCompleted, cycleId);
              
              // Check calendar for scheduled date
              let scheduledDateHtml = '';
              if (typeof CalendarManager !== 'undefined') {
                  const schedule = CalendarManager.getCalendar();
                  const scheduledItem = schedule.find(s => s.lessonId === lesson.id);
                  if (scheduledItem) {
                      const dateStr = new Date(scheduledItem.date).toLocaleDateString('pt-BR');
                      scheduledDateHtml = `<div style="font-size: 0.8rem; color: var(--gold-500); margin-top: 8px;">📅 Previsto: ${dateStr}</div>`;
                  }
              }
  
              div.innerHTML = `
                  <div class="lesson-card-header">
                      <div class="lesson-number">${lesson.number}</div>
                      <div class="lesson-status">
                          ${isCompleted ? '✅ Concluída' : '⏳ Pendente'}
                      </div>
                  </div>
                  <h3>${lesson.icon} ${lesson.title}</h3>
                  <p>${lesson.summary.substring(0, 60)}...</p>
                  <div class="lesson-badge">${lesson.theme}</div>
                  ${scheduledDateHtml}
              `;
              return div;
          }
  
          function openLessonModal(lesson, isCompleted, cycleId) {
              currentLessonView = { lessonId: lesson.id, cycleId: cycleId };
              
              document.getElementById('modal-lesson-title').innerHTML = `${lesson.icon} ${lesson.title}`;
              document.getElementById('modal-lesson-number').innerText = lesson.number;
              document.getElementById('modal-lesson-theme').innerText = lesson.theme;
              document.getElementById('modal-lesson-summary').innerText = lesson.summary;
              
              const pointsList = document.getElementById('modal-lesson-points');
              pointsList.innerHTML = '';
              lesson.keyPoints.forEach(p => {
                  const li = document.createElement('li');
                  li.innerText = p;
                  pointsList.appendChild(li);
              });
  
              const versesList = document.getElementById('modal-lesson-verses');
              versesList.innerHTML = '';
              lesson.keyVerses.forEach(v => {
                  const b = document.createElement('div');
                  b.className = 'verse-box';
                  b.innerText = v;
                  versesList.appendChild(b);
              });
  
              const questionsList = document.getElementById('modal-lesson-questions');
              questionsList.innerHTML = '';
              lesson.reflectionQuestions.forEach(q => {
                  const li = document.createElement('li');
                  li.innerText = q;
                  questionsList.appendChild(li);
              });
  
              const actionDiv = document.getElementById('modal-completion-action');
              if (isCompleted) {
                  actionDiv.innerHTML = `
                      <div class="badge-completed-large">
                          <i class="fa-solid fa-check"></i> Lição Concluída
                      </div>
                  `;
              } else {
                  actionDiv.innerHTML = `
                      <button class="btn btn-secondary" onclick="markCurrentLessonCompleted()" style="padding: 1rem 2rem; font-size: 1.1rem;">
                          <i class="fa-solid fa-check-circle"></i> Marcar como Concluída
                      </button>
                  `;
              }
  
              document.getElementById('lesson-modal').classList.add('active');
          }
  
          function markCurrentLessonCompleted() {
              if (!currentStudent || !currentLessonView) return;
              
              try {
                  // Add to completed lessons array
                  const completed = currentStudent.completedLessons || [];
                  if (!completed.includes(currentLessonView.lessonId)) {
                      completed.push(currentLessonView.lessonId);
                      
                      // Note: If data.js has StudentManager.update, use it. Otherwise, update DB directly.
                      // Assuming StudentManager.update is available or similar
                      currentStudent.completedLessons = completed;
                      const allStudents = StudentManager.getAll();
                      const index = allStudents.findIndex(s => s.id === currentStudent.id);
                      if (index !== -1) {
                          allStudents[index] = currentStudent;
                          DB.save('discipulado_students', allStudents);
                      }
                  }
                  
                  showToast('Lição marcada como concluída!', 'success');
                  document.getElementById('lesson-modal').classList.remove('active');
                  updateDashboard(); // Refresh UI
              } catch (error) {
                  console.error(error);
                  showToast('Erro ao atualizar lição.', 'error');
              }
          }
  
          function updateCertificatesTab(c1Completed, c1Total, c2Completed, c2Total) {
              // Cycle 1
              const c1Progress = c1Total === 0 ? 0 : Math.round((c1Completed / c1Total) * 100);
              if (c1Completed === c1Total && c1Total > 0) {
                  document.getElementById('cert-c1-locked').style.display = 'none';
                  document.getElementById('cert-c1-unlocked').style.display = 'block';
                  document.getElementById('cert-c1-name').innerText = currentStudent.name.toUpperCase();
                  document.getElementById('cert-c1-date').innerText = formatDate(new Date().toISOString());
              } else {
                  document.getElementById('cert-c1-locked').style.display = 'block';
                  document.getElementById('cert-c1-unlocked').style.display = 'none';
                  document.getElementById('cert-c1-progress').style.width = `${c1Progress}%`;
              }
  
              // Cycle 2
              const c2Progress = c2Total === 0 ? 0 : Math.round((c2Completed / c2Total) * 100);
              if (c2Completed === c2Total && c2Total > 0) {
                  document.getElementById('cert-c2-locked').style.display = 'none';
                  document.getElementById('cert-c2-unlocked').style.display = 'block';
                  document.getElementById('cert-c2-name').innerText = currentStudent.name.toUpperCase();
                  document.getElementById('cert-c2-date').innerText = formatDate(new Date().toISOString());
              } else {
                  document.getElementById('cert-c2-locked').style.display = 'block';
                  document.getElementById('cert-c2-unlocked').style.display = 'none';
                  document.getElementById('cert-c2-progress').style.width = `${c2Progress}%`;
              }
          }
  
          function updateProfileTab() {
              document.getElementById('profile-name').innerText = currentStudent.name;
              document.getElementById('profile-code').innerText = currentStudent.accessCode;
              document.getElementById('profile-phone').innerText = currentStudent.phone || 'Não informado';
              document.getElementById('profile-enrollment').innerText = formatDate(currentStudent.enrollmentDate);
  
              // Attendance Rate
              const attendances = AttendanceManager.getByStudent(currentStudent.id);
              const attendanceTotal = attendances.length;
              const presenceCount = attendances.filter(a => a.status === 'present').length;
              const rate = attendanceTotal > 0 ? Math.round((presenceCount / attendanceTotal) * 100) : 0;
              document.getElementById('profile-attendance').innerText = `${rate}% (${presenceCount} presenças em ${attendanceTotal} registros)`;
  
              // Timeline (Mock dates for completed lessons, since we only store IDs)
              // Ideally we would store {id, date} for completion, but based on typical DB schema provided, we just have IDs.
              const timelineContainer = document.getElementById('profile-timeline');
              const completed = currentStudent.completedLessons || [];
              
              if (completed.length === 0) {
                  timelineContainer.innerHTML = '<p class="text-light">Nenhuma lição concluída ainda.</p>';
              } else {
                  timelineContainer.innerHTML = '';
                  // Get lesson details for completed IDs
                  const completedDetails = [];
                  const c1 = LessonManager.getCycle('cycle1') || [];
                  const c2 = LessonManager.getCycle('cycle2') || [];
                  
                  completed.forEach(id => {
                      const l1 = c1.find(l => l.id === id);
                      if (l1) completedDetails.push({...l1, cycle: 'Ciclo 1'});
                      const l2 = c2.find(l => l.id === id);
                      if (l2) completedDetails.push({...l2, cycle: 'Ciclo 2'});
                  });
  
                  // Display latest first (assuming they were appended in order)
                  completedDetails.reverse().forEach((lesson, index) => {
                      const item = document.createElement('div');
                      item.className = 'timeline-item';
                      item.innerHTML = `
                          <div class="timeline-date">Concluída (Lição ${lesson.number})</div>
                          <div class="timeline-content">
                              ${lesson.icon} ${lesson.title} <span class="text-light" style="font-size:0.8rem">(${lesson.cycle})</span>
                          </div>
                      `;
                      timelineContainer.appendChild(item);
                  });
              }
          }
  
          async function downloadCertificate(cycle) {
              const certElement = document.getElementById(`certificate-dom-${cycle}`);
              
              try {
                  showToast('Gerando PDF... aguarde', 'info');
                  
                  const canvas = await html2canvas(certElement, {
                      scale: 2, // Higher quality
                      backgroundColor: '#fffdf5',
                      useCORS: true
                  });
                  
                  const imgData = canvas.toDataURL('image/jpeg', 1.0);
                  
                  // A4 Landscape: 297 x 210 mm
                  const { jsPDF } = window.jspdf;
                  const pdf = new jsPDF({
                      orientation: 'landscape',
                      unit: 'mm',
                      format: 'a4'
                  });
                  
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                  
                  // Center vertically if needed
                  const yPos = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
                  
                  pdf.addImage(imgData, 'JPEG', 0, yPos > 0 ? yPos : 0, pdfWidth, pdfHeight);
                  pdf.save(`Certificado_Discipulado_Ciclo${cycle === 'c1' ? '1' : '2'}_${currentStudent.name.replace(/\s+/g, '_')}.pdf`);
                  
                  showToast('Certificado baixado com sucesso!', 'success');
              } catch (err) {
                  console.error('Error generating PDF:', err);
                  showToast('Erro ao gerar certificado. Tente novamente.', 'error');
              }
          }
  
      </script>
  </body>
  </html>
