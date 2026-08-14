/* ============================================
   DISCIPULADO AD CML CAB - Data Layer
   Gerenciamento de dados com localStorage
   ============================================ */

const DB = {
  // Keys
  KEYS: {
    STUDENTS: 'disc_students',
    ATTENDANCE: 'disc_attendance',
    SETTINGS: 'disc_settings',
    NOTES: 'disc_notes',
    TEACHERS: 'disc_teachers',
    LESSONS_DATA: 'disc_lessons_data',
    ACTIVITIES: 'disc_activities',
    CALENDAR: 'disc_calendar',
    CONTENTS: 'disc_contents',
    GRADES: 'disc_grades',
  },

  // Initialize default data
  init() {
    if (!localStorage.getItem(this.KEYS.STUDENTS)) {
      localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.ATTENDANCE)) {
      localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.SETTINGS)) {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
        churchName: 'Assembleia de Deus CML CAB',
        pastorName: 'Pr. Edvaldo Romualdo',
        address: 'Rua das Mangueiras, 19 â€“ Novo Horizonte',
        phone: '',
      }));
    }
    if (!localStorage.getItem(this.KEYS.NOTES)) {
      localStorage.setItem(this.KEYS.NOTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.TEACHERS)) {
      localStorage.setItem(this.KEYS.TEACHERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.ACTIVITIES)) {
      localStorage.setItem(this.KEYS.ACTIVITIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.LESSONS_DATA)) {
      // Migrate hardcoded LESSONS if available, else empty arrays
      const initialLessons = (typeof LESSONS !== 'undefined') ? LESSONS : { cycle1: [], cycle2: [] };
      localStorage.setItem(this.KEYS.LESSONS_DATA, JSON.stringify(initialLessons));
    }
  },

  // Generic CRUD
  getAll(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getById(key, id) {
    const items = this.getAll(key);
    return items.find(item => item.id === id);
  },

  add(key, item) {
    const items = this.getAll(key);
    item.id = this.generateId();
    item.createdAt = new Date().toISOString();
    items.push(item);
    this.save(key, items);
    return item;
  },

  update(key, id, updates) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.save(key, items);
      return items[index];
    }
    return null;
  },

  remove(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(item => item.id !== id);
    this.save(key, filtered);
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Settings
  getSettings() {
    return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || '{}');
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },
};

// ============================================
// Teacher Management
// ============================================
const TeacherManager = {
  getAll() {
    return DB.getAll(DB.KEYS.TEACHERS);
  },
  getById(id) {
    return DB.getById(DB.KEYS.TEACHERS, id);
  },
  add(teacherData) {
    return DB.add(DB.KEYS.TEACHERS, teacherData);
  },
  update(id, updates) {
    return DB.update(DB.KEYS.TEACHERS, id, updates);
  },
  remove(id) {
    DB.remove(DB.KEYS.TEACHERS, id);
  },
  authenticate(accessCode) {
    // ProvisÃ³rio: para o portal reconhecer o professor, podemos usar um cÃ³digo de acesso tambÃ©m
    return this.getAll().find(t => t.accessCode === accessCode.toUpperCase());
  }
};

// ============================================
// Lesson Management (Dynamic Curriculum)
// ============================================
const LessonManager = {
  getAllData() {
    return JSON.parse(localStorage.getItem(DB.KEYS.LESSONS_DATA) || '{"cycle1":[],"cycle2":[]}');
  },
  saveAllData(data) {
    localStorage.setItem(DB.KEYS.LESSONS_DATA, JSON.stringify(data));
  },
  getCycle(cycleId) {
    const data = this.getAllData();
    return data[cycleId] || [];
  },
  addLesson(cycleId, lessonData) {
    const data = this.getAllData();
    if (!data[cycleId]) data[cycleId] = [];
    lessonData.id = DB.generateId();
    data[cycleId].push(lessonData);
    this.saveAllData(data);
    return lessonData;
  },
  updateLesson(cycleId, lessonId, updates) {
    const data = this.getAllData();
    if (!data[cycleId]) return null;
    const index = data[cycleId].findIndex(l => l.id === lessonId);
    if (index !== -1) {
      data[cycleId][index] = { ...data[cycleId][index], ...updates };
      this.saveAllData(data);
      return data[cycleId][index];
    }
    return null;
  },
  removeLesson(cycleId, lessonId) {
    const data = this.getAllData();
    if (!data[cycleId]) return;
    data[cycleId] = data[cycleId].filter(l => l.id !== lessonId);
    this.saveAllData(data);
  }
};

// ============================================
// Activity Management
// ============================================
const ActivityManager = {
  getAll() {
    return DB.getAll(DB.KEYS.ACTIVITIES);
  },
  add(activityData) {
    return DB.add(DB.KEYS.ACTIVITIES, activityData);
  },
  update(id, updates) {
    return DB.update(DB.KEYS.ACTIVITIES, id, updates);
  },
  remove(id) {
    DB.remove(DB.KEYS.ACTIVITIES, id);
  }
};

// ============================================
// Student Management
// ============================================
const StudentManager = {
  getAll() {
    return DB.getAll(DB.KEYS.STUDENTS);
  },

  getById(id) {
    return DB.getById(DB.KEYS.STUDENTS, id);
  },

  add(studentData) {
    const student = {
      ...studentData,
      status: 'ativo',
      completedLessons: [],
      accessCode: this.generateAccessCode(),
      enrolledAt: new Date().toISOString(),
      mentor: studentData.mentor || '',
    };
    return DB.add(DB.KEYS.STUDENTS, student);
  },

  update(id, updates) {
    return DB.update(DB.KEYS.STUDENTS, id, updates);
  },

  remove(id) {
    DB.remove(DB.KEYS.STUDENTS, id);
  },

  getActive() {
    return this.getAll().filter(s => s.status === 'ativo');
  },

  getGraduated() {
    return this.getAll().filter(s => s.status === 'formado');
  },

  getInactive() {
    return this.getAll().filter(s => s.status === 'inativo');
  },

  completeLesson(studentId, lessonId) {
    const student = this.getById(studentId);
    if (student && !student.completedLessons.includes(lessonId)) {
      student.completedLessons.push(lessonId);
      student.completedLessons.sort();
      this.update(studentId, { completedLessons: student.completedLessons });
    }
  },

  uncompleteLesson(studentId, lessonId) {
    const student = this.getById(studentId);
    if (student) {
      student.completedLessons = student.completedLessons.filter(l => l !== lessonId);
      this.update(studentId, { completedLessons: student.completedLessons });
    }
  },

  getProgress(studentId) {
    const student = this.getById(studentId);
    if (!student) return 0;
    const totalLessons = LESSONS.cycle1.length + LESSONS.cycle2.length;
    return Math.round((student.completedLessons.length / totalLessons) * 100);
  },

  getCycle1Progress(studentId) {
    const student = this.getById(studentId);
    if (!student) return 0;
    const cycle1Ids = LESSONS.cycle1.map(l => l.id);
    const completed = student.completedLessons.filter(l => cycle1Ids.includes(l));
    return Math.round((completed.length / LESSONS.cycle1.length) * 100);
  },

  getCycle2Progress(studentId) {
    const student = this.getById(studentId);
    if (!student) return 0;
    const cycle2Ids = LESSONS.cycle2.map(l => l.id);
    const completed = student.completedLessons.filter(l => cycle2Ids.includes(l));
    return Math.round((completed.length / LESSONS.cycle2.length) * 100);
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.accessCode?.toLowerCase().includes(q)
    );
  },

  generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },

  findByAccessCode(code) {
    return this.getAll().find(s => s.accessCode === code.toUpperCase());
  },

  getAbsentStudents(weeks = 2) {
    const now = new Date();
    const attendance = DB.getAll(DB.KEYS.ATTENDANCE);
    const activeStudents = this.getActive();
    const cutoff = new Date(now.getTime() - (weeks * 7 * 24 * 60 * 60 * 1000));

    return activeStudents.filter(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.id && new Date(a.date) > cutoff);
      return studentAttendance.length === 0;
    });
  },

  getBirthdays(month) {
    const m = month || new Date().getMonth() + 1;
    return this.getActive().filter(s => {
      if (!s.birthdate) return false;
      const bMonth = new Date(s.birthdate).getMonth() + 1;
      return bMonth === m;
    });
  },
};

// ============================================
// Attendance Management
// ============================================
const AttendanceManager = {
  record(studentId, date, present = true, eventType = 'discipulado') {
    const record = {
      studentId,
      date: date || new Date().toISOString().split('T')[0],
      present,
      eventType,
    };
    return DB.add(DB.KEYS.ATTENDANCE, record);
  },

  getByStudent(studentId) {
    return DB.getAll(DB.KEYS.ATTENDANCE).filter(a => a.studentId === studentId);
  },

  getByDate(date) {
    return DB.getAll(DB.KEYS.ATTENDANCE).filter(a => a.date === date);
  },

  getAttendanceRate(studentId) {
    const records = this.getByStudent(studentId);
    if (records.length === 0) return 0;
    const present = records.filter(r => r.present).length;
    return Math.round((present / records.length) * 100);
  },
};

// ============================================
// Notes Management
// ============================================
const NotesManager = {
  add(studentId, text, type = 'geral') {
    const note = { studentId, text, type };
    return DB.add(DB.KEYS.NOTES, note);
  },

  getByStudent(studentId) {
    return DB.getAll(DB.KEYS.NOTES)
      .filter(n => n.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  remove(noteId) {
    DB.remove(DB.KEYS.NOTES, noteId);
  },
};

// ============================================
// Export Manager
// ============================================
const ExportManager = {
  toCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          let val = row[h];
          if (Array.isArray(val)) val = val.join('; ');
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            val = '"' + val.replace(/"/g, '""') + '"';
          }
          return val ?? '';
        }).join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  exportStudents() {
    const students = StudentManager.getAll().map(s => ({
      Nome: s.name || '',
      Telefone: s.phone || '',
      Email: s.email || '',
      'Data de Nascimento': s.birthdate ? formatDate(s.birthdate) : '',
      'Estado Civil': s.maritalStatus || '',
      EndereÃ§o: s.address || '',
      'Data de ConversÃ£o': s.conversionDate ? formatDate(s.conversionDate) : '',
      'Quem Evangelizou': s.evangelizedBy || '',
      Apadrinhador: s.sponsor || '',
      Status: s.status || '',
      'CÃ³digo de Acesso': s.accessCode || '',
      'LiÃ§Ãµes ConcluÃ­das': s.completedLessons?.length || 0,
      'Progresso (%)': StudentManager.getProgress(s.id),
      'FrequÃªncia (%)': AttendanceManager.getAttendanceRate(s.id),
      'Data de Cadastro': s.createdAt ? formatDate(s.createdAt) : '',
    }));
    this.toCSV(students, `discipulado_alunos_${formatDateFile()}.csv`);
  },

  exportAttendance() {
    const records = DB.getAll(DB.KEYS.ATTENDANCE).map(a => {
      const student = StudentManager.getById(a.studentId);
      return {
        Aluno: student?.name || 'Desconhecido',
        Data: a.date,
        Presente: a.present ? 'Sim' : 'NÃ£o',
      };
    });
    this.toCSV(records, `discipulado_frequencia_${formatDateFile()}.csv`);
  },

  backupAll() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      students: DB.getAll(DB.KEYS.STUDENTS),
      attendance: DB.getAll(DB.KEYS.ATTENDANCE),
      notes: DB.getAll(DB.KEYS.NOTES),
      settings: DB.getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discipulado_backup_${formatDateFile()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.students) DB.save(DB.KEYS.STUDENTS, data.students);
          if (data.attendance) DB.save(DB.KEYS.ATTENDANCE, data.attendance);
          if (data.notes) DB.save(DB.KEYS.NOTES, data.notes);
          if (data.settings) DB.saveSettings(data.settings);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
};

// ============================================
// WhatsApp Message Templates
// ============================================
const WhatsAppTemplates = {
  welcome(name) {
    return `OlÃ¡, ${name}! ðŸ™\n\nSeja muito bem-vindo(a) Ã  *Assembleia de Deus CML CAB*!\n\nEstamos muito felizes pela sua decisÃ£o de seguir a Jesus Cristo. VocÃª foi inscrito(a) no nosso programa de *Discipulado*, onde iremos caminhar juntos nessa jornada de fÃ©.\n\nPrepare seu coraÃ§Ã£o! Em breve entraremos em contato com mais informaÃ§Ãµes.\n\n*"Uns plantam, outros regam; mas Deus dÃ¡ o crescimento"* - 1 Co 3:6\n\nDeus abenÃ§oe! âœï¸`;
  },

  reminder(name, topic, date, time) {
    return `OlÃ¡, ${name}! ðŸ“–\n\nLembramos que nosso encontro de *Discipulado* estÃ¡ chegando:\n\nðŸ“… *Data:* ${date}\nâ° *HorÃ¡rio:* ${time}\nðŸ“š *Tema:* ${topic}\n\nSua presenÃ§a Ã© muito importante! Estamos preparando tudo com carinho.\n\nDeus abenÃ§oe! ðŸ™`;
  },

  congratsLesson(name, lesson) {
    return `ParabÃ©ns, ${name}! ðŸŽ‰\n\nVocÃª concluiu mais uma liÃ§Ã£o do Discipulado:\nðŸ“š *${lesson}*\n\nContinue firme nessa caminhada! Cada passo Ã© um avanÃ§o no seu crescimento espiritual.\n\n*"Eu plantei, Apolo regou; mas Deus dÃ¡ o crescimento."* - 1 Co 3:6\n\nDeus abenÃ§oe! âœï¸`;
  },

  congratsGraduation(name) {
    return `ðŸŽ“ *PARABÃ‰NS, ${name}!* ðŸŽ“\n\nVocÃª concluiu o programa de *Discipulado* da Assembleia de Deus CML CAB!\n\nFoi uma jornada incrÃ­vel de aprendizado e crescimento espiritual. Estamos muito orgulhosos de vocÃª!\n\nSeu certificado estÃ¡ sendo preparado. ðŸ“œ\n\n*"Combati o bom combate, acabei a carreira, guardei a fÃ©."* - 2 Tm 4:7\n\nDeus abenÃ§oe sua caminhada! âœï¸ðŸ™`;
  },

  missingStudent(name, weeks) {
    return `OlÃ¡, ${name}! ðŸ™\n\nSentimos sua falta nos encontros de *Discipulado*! JÃ¡ se passaram ${weeks} semanas desde sua Ãºltima presenÃ§a.\n\nSabemos que a vida pode ser corrida, mas queremos que saiba que vocÃª faz parte desta famÃ­lia e sua presenÃ§a Ã© muito importante para nÃ³s.\n\nPodemos ajudar em algo? Estamos aqui por vocÃª!\n\nDeus abenÃ§oe! âœï¸`;
  },

  birthday(name) {
    return `ðŸŽ‚ *Feliz AniversÃ¡rio, ${name}!* ðŸŽ‰\n\nHoje Ã© um dia especial! Que Deus abenÃ§oe sua vida com muita saÃºde, paz e alegria.\n\n*"O Senhor te abenÃ§oe e te guarde; o Senhor faÃ§a resplandecer o seu rosto sobre ti e tenha misericÃ³rdia de ti."* - Nm 6:24-25\n\nCom carinho, sua famÃ­lia da Assembleia de Deus CML CAB! âœï¸ðŸŽ‚`;
  },
};

function sendWhatsApp(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
}

// ============================================
// Lessons Content
// ============================================
const LESSONS = {
  cycle1: [
    {
      id: 'c1_01',
      number: 1,
      title: 'Conhecendo a BÃ­blia',
      theme: 'Fundamentos',
      icon: 'ðŸ“–',
      verses: ['2 TimÃ³teo 3:16-17', 'Salmos 119:105', 'Hebreus 4:12'],
      summary: 'A BÃ­blia Ã© a Palavra de Deus, inspirada pelo EspÃ­rito Santo. Ela Ã© composta por 66 livros, divididos em Antigo e Novo Testamento. Ã‰ nosso manual de fÃ© e prÃ¡tica, a luz para nosso caminho e alimento espiritual diÃ¡rio.',
      keyPoints: [
        'A BÃ­blia Ã© a Palavra inspirada por Deus',
        'SÃ£o 66 livros: 39 no AT e 27 no NT',
        'Ã‰ nosso guia, luz e alimento espiritual',
        'Devemos ler, estudar e meditar diariamente',
        'A BÃ­blia Ã© viva e eficaz para transformar vidas',
      ],
      reflection: [
        'VocÃª tem o hÃ¡bito de ler a BÃ­blia diariamente?',
        'Qual versÃ­culo mais marcou sua vida atÃ© hoje?',
        'Como a Palavra de Deus pode mudar sua rotina?',
      ],
    },
    {
      id: 'c1_02',
      number: 2,
      title: 'Conhecendo Deus',
      theme: 'Fundamentos',
      icon: 'âœï¸',
      verses: ['JoÃ£o 3:16', 'ÃŠxodo 34:6-7', 'Salmos 103:8'],
      summary: 'Deus Ã© o Criador de todas as coisas. Ele Ã© eterno, onipotente, onisciente e onipresente. Seu maior atributo Ã© o amor. Ele se revela como Pai, Filho e EspÃ­rito Santo â€” a SantÃ­ssima Trindade.',
      keyPoints: [
        'Deus Ã© o Criador de tudo que existe',
        'Ele Ã© eterno, todo-poderoso e sabe todas as coisas',
        'Deus Ã© amor e nos amou primeiro',
        'Ele se revela como Trindade: Pai, Filho e EspÃ­rito Santo',
        'Podemos ter um relacionamento pessoal com Ele',
      ],
      reflection: [
        'O que significa para vocÃª saber que Deus Ã© amor?',
        'Como vocÃª descreveria Deus para alguÃ©m que nÃ£o O conhece?',
        'De que forma Deus tem se revelado em sua vida?',
      ],
    },
    {
      id: 'c1_03',
      number: 3,
      title: 'Conhecendo a SalvaÃ§Ã£o',
      theme: 'Fundamentos',
      icon: 'ðŸ•Šï¸',
      verses: ['Romanos 10:9-10', 'EfÃ©sios 2:8-9', 'Atos 4:12'],
      summary: 'A salvaÃ§Ã£o Ã© o plano de Deus para resgatar a humanidade do pecado. AtravÃ©s da morte e ressurreiÃ§Ã£o de Jesus Cristo, recebemos perdÃ£o e vida eterna. A salvaÃ§Ã£o Ã© pela graÃ§a, mediante a fÃ©.',
      keyPoints: [
        'Todos pecaram e carecem da glÃ³ria de Deus',
        'Jesus morreu em nosso lugar na cruz',
        'A salvaÃ§Ã£o Ã© pela graÃ§a, mediante a fÃ©',
        'NÃ£o Ã© por obras, para que ninguÃ©m se glorie',
        'Quem crÃª e confessa a Jesus Ã© salvo',
      ],
      reflection: [
        'VocÃª jÃ¡ teve um encontro pessoal com Jesus?',
        'O que a salvaÃ§Ã£o significa na sua vida prÃ¡tica?',
        'Como vocÃª pode compartilhar essa mensagem com outros?',
      ],
    },
    {
      id: 'c1_04',
      number: 4,
      title: 'Conhecendo a Igreja',
      theme: 'Fundamentos',
      icon: 'â›ª',
      verses: ['Mateus 16:18', 'Atos 2:42-47', '1 CorÃ­ntios 12:27'],
      summary: 'A Igreja Ã© o Corpo de Cristo na terra, formada por todos os que creem. NÃ£o Ã© apenas um lugar fÃ­sico, mas uma comunidade de fÃ©, amor e serviÃ§o. Congregar Ã© fundamental para o crescimento espiritual.',
      keyPoints: [
        'A Igreja Ã© o Corpo de Cristo',
        'Cada membro tem uma funÃ§Ã£o importante',
        'Congregar fortalece a fÃ© e o crescimento',
        'A igreja primitiva era unida em doutrina, comunhÃ£o, partir do pÃ£o e oraÃ§Ã£o',
        'Devemos servir e contribuir com nossos dons',
      ],
      reflection: [
        'O que a igreja significa para vocÃª?',
        'Como vocÃª pode contribuir com a comunidade?',
        'Qual Ã© o seu papel no Corpo de Cristo?',
      ],
    },
    {
      id: 'c1_05',
      number: 5,
      title: 'Conhecendo o Valor da OraÃ§Ã£o',
      theme: 'Fundamentos',
      icon: 'ðŸ™',
      verses: ['Filipenses 4:6-7', 'Mateus 6:9-13', '1 Tessalonicenses 5:17'],
      summary: 'A oraÃ§Ã£o Ã© a comunicaÃ§Ã£o direta com Deus. Ã‰ atravÃ©s dela que nos relacionamos com o Pai, apresentamos nossas necessidades, agradecemos e buscamos direÃ§Ã£o. Jesus nos ensinou a orar como modelo.',
      keyPoints: [
        'Orar Ã© conversar com Deus',
        'Jesus nos ensinou o Pai Nosso como modelo',
        'Devemos orar sem cessar, em todo tempo',
        'A oraÃ§Ã£o traz paz e fortalece a fÃ©',
        'Podemos orar em qualquer lugar e momento',
      ],
      reflection: [
        'Qual Ã© o seu hÃ¡bito de oraÃ§Ã£o?',
        'VocÃª jÃ¡ experimentou respostas de oraÃ§Ã£o?',
        'Como a oraÃ§Ã£o pode transformar seu dia a dia?',
      ],
    },
    {
      id: 'c1_06',
      number: 6,
      title: 'O DiscÃ­pulo e a FÃ©',
      theme: 'Doutrinas BÃ­blicas',
      icon: 'ðŸ›¡ï¸',
      verses: ['Hebreus 11:1', 'Hebreus 11:6', 'Romanos 10:17'],
      summary: 'A fÃ© Ã© o fundamento da vida cristÃ£. Ã‰ a certeza das coisas que se esperam e a convicÃ§Ã£o de fatos que nÃ£o se veem. Sem fÃ© Ã© impossÃ­vel agradar a Deus. A fÃ© vem pelo ouvir a Palavra.',
      keyPoints: [
        'FÃ© Ã© certeza e convicÃ§Ã£o no invisÃ­vel',
        'Sem fÃ© Ã© impossÃ­vel agradar a Deus',
        'A fÃ© vem pelo ouvir a Palavra de Deus',
        'A fÃ© produz obras e transforma a vida',
        'Devemos crescer na fÃ© diariamente',
      ],
      reflection: [
        'O que Ã© fÃ© para vocÃª?',
        'Em quais Ã¡reas da sua vida vocÃª precisa de mais fÃ©?',
        'Como fortalecer sua fÃ© no dia a dia?',
      ],
    },
    {
      id: 'c1_07',
      number: 7,
      title: 'O DiscÃ­pulo e a ObediÃªncia',
      theme: 'Doutrinas BÃ­blicas',
      icon: 'ðŸ“œ',
      verses: ['JoÃ£o 14:15', '1 Samuel 15:22', 'Tiago 1:22'],
      summary: 'A obediÃªncia Ã© fruto do amor a Deus. Jesus disse: "Se me amais, guardareis os meus mandamentos." Obedecer Ã© melhor que sacrificar. NÃ£o basta ouvir a Palavra, Ã© preciso praticÃ¡-la.',
      keyPoints: [
        'ObediÃªncia Ã© demonstraÃ§Ã£o de amor a Deus',
        'Obedecer Ã© melhor que sacrificar',
        'Devemos ser praticantes da Palavra, nÃ£o apenas ouvintes',
        'A obediÃªncia traz bÃªnÃ§Ã£os e proteÃ§Ã£o',
        'Jesus foi obediente atÃ© a morte na cruz',
      ],
      reflection: [
        'Em que Ã¡reas da sua vida vocÃª precisa ser mais obediente?',
        'O que te impede de obedecer plenamente a Deus?',
        'Como a obediÃªncia tem transformado sua caminhada?',
      ],
    },
    {
      id: 'c1_08',
      number: 8,
      title: 'O DiscÃ­pulo e o DÃ­zimo',
      theme: 'FinanÃ§as',
      icon: 'ðŸ’°',
      verses: ['Malaquias 3:10', 'Mateus 23:23', '2 CorÃ­ntios 9:7'],
      summary: 'O dÃ­zimo Ã© a dÃ©cima parte de nossa renda, devolvida a Deus como ato de gratidÃ£o e fidelidade. Ã‰ um princÃ­pio bÃ­blico que demonstra nossa confianÃ§a na provisÃ£o divina.',
      keyPoints: [
        'O dÃ­zimo Ã© a dÃ©cima parte de nossa renda',
        'Ã‰ um ato de fidelidade e gratidÃ£o a Deus',
        'Deus promete abrir as janelas do cÃ©u ao dizimista fiel',
        'Dar com alegria e nÃ£o por obrigaÃ§Ã£o',
        'As ofertas complementam o dÃ­zimo como expressÃ£o de amor',
      ],
      reflection: [
        'VocÃª compreende o propÃ³sito bÃ­blico do dÃ­zimo?',
        'Como a fidelidade financeira reflete sua fÃ©?',
        'De que forma Deus tem provido em sua vida?',
      ],
    },
    {
      id: 'c1_09',
      number: 9,
      title: 'O DiscÃ­pulo e o EspÃ­rito Santo',
      theme: 'EspÃ­rito Santo',
      icon: 'ðŸ”¥',
      verses: ['Atos 1:8', 'JoÃ£o 14:26', 'Romanos 8:26'],
      summary: 'O EspÃ­rito Santo Ã© a terceira pessoa da Trindade. Ele Ã© nosso Consolador, Guia e Mestre. Habita em todo cristÃ£o e nos capacita para viver a vida cristÃ£ e servir ao prÃ³ximo.',
      keyPoints: [
        'O EspÃ­rito Santo Ã© Deus, a terceira pessoa da Trindade',
        'Ele Ã© o Consolador prometido por Jesus',
        'Habita em todo aquele que crÃª',
        'Nos guia em toda a verdade',
        'Nos capacita para o serviÃ§o cristÃ£o',
      ],
      reflection: [
        'VocÃª reconhece a presenÃ§a do EspÃ­rito Santo em sua vida?',
        'Como Ele tem te guiado nas decisÃµes?',
        'VocÃª busca ser cheio do EspÃ­rito Santo?',
      ],
    },
    {
      id: 'c1_10',
      number: 10,
      title: 'O DiscÃ­pulo Vivendo Cheio do EspÃ­rito Santo',
      theme: 'EspÃ­rito Santo',
      icon: 'ðŸ’§',
      verses: ['EfÃ©sios 5:18', 'Atos 2:4', 'GÃ¡latas 5:16'],
      summary: 'Viver cheio do EspÃ­rito Santo significa ter uma vida de rendiÃ§Ã£o e comunhÃ£o com Deus. Ã‰ ser guiado pelo EspÃ­rito em todas as Ã¡reas da vida, produzindo fruto e exercendo os dons.',
      keyPoints: [
        'Ser cheio do EspÃ­rito Ã© um mandamento bÃ­blico',
        'O batismo com o EspÃ­rito Santo Ã© uma experiÃªncia real',
        'Andar no EspÃ­rito Ã© viver em santidade',
        'A vida cheia do EspÃ­rito produz fruto',
        'Devemos buscar continuamente essa plenitude',
      ],
      reflection: [
        'O que significa para vocÃª ser cheio do EspÃ­rito?',
        'Como seria seu dia a dia guiado pelo EspÃ­rito?',
        'VocÃª tem buscado essa plenitude em sua vida?',
      ],
    },
    {
      id: 'c1_11',
      number: 11,
      title: 'O DiscÃ­pulo e os Dons do EspÃ­rito Santo',
      theme: 'EspÃ­rito Santo',
      icon: 'ðŸŽ',
      verses: ['1 CorÃ­ntios 12:4-11', '1 CorÃ­ntios 14:1', 'Romanos 12:6-8'],
      summary: 'Os dons espirituais sÃ£o capacitaÃ§Ãµes sobrenaturais concedidas pelo EspÃ­rito Santo para edificaÃ§Ã£o da Igreja. Cada cristÃ£o recebe pelo menos um dom para servir ao Corpo de Cristo.',
      keyPoints: [
        'Os dons sÃ£o dados pelo EspÃ­rito Santo',
        'SÃ£o para edificaÃ§Ã£o da Igreja, nÃ£o para vaidade pessoal',
        'Existem dons de revelaÃ§Ã£o, poder e inspiraÃ§Ã£o',
        'Cada cristÃ£o recebe dons para servir',
        'Devemos buscar os melhores dons com amor',
      ],
      reflection: [
        'VocÃª conhece seus dons espirituais?',
        'Como vocÃª pode usar seus dons para servir a igreja?',
        'Por que o amor Ã© mais importante que os dons?',
      ],
    },
    {
      id: 'c1_12',
      number: 12,
      title: 'O DiscÃ­pulo e o Fruto do EspÃ­rito Santo',
      theme: 'CarÃ¡ter CristÃ£o',
      icon: 'ðŸ‡',
      verses: ['GÃ¡latas 5:22-23', 'JoÃ£o 15:5', 'Mateus 7:16-20'],
      summary: 'O fruto do EspÃ­rito Ã© o resultado da vida cristÃ£ em comunhÃ£o com Deus: amor, alegria, paz, paciÃªncia, benignidade, bondade, fidelidade, mansidÃ£o e domÃ­nio prÃ³prio.',
      keyPoints: [
        'O fruto do EspÃ­rito tem 9 caracterÃ­sticas',
        'Ã‰ produzido pela comunhÃ£o com Cristo',
        'Amor, alegria, paz, paciÃªncia, benignidade',
        'Bondade, fidelidade, mansidÃ£o, domÃ­nio prÃ³prio',
        'Pelos frutos conhecemos a Ã¡rvore',
      ],
      reflection: [
        'Quais frutos do EspÃ­rito sÃ£o mais visÃ­veis na sua vida?',
        'Em quais aspectos vocÃª precisa crescer mais?',
        'Como produzir mais fruto em sua caminhada?',
      ],
    },
    {
      id: 'c1_13',
      number: 13,
      title: 'O DiscÃ­pulo e o Evangelismo',
      theme: 'MissÃµes',
      icon: 'ðŸ“£',
      verses: ['Mateus 28:19-20', 'Marcos 16:15', 'Atos 1:8'],
      summary: 'Evangelizar Ã© compartilhar as boas novas de salvaÃ§Ã£o em Cristo Jesus. Ã‰ a missÃ£o principal de todo discÃ­pulo. Jesus nos comissionou a fazer discÃ­pulos de todas as naÃ§Ãµes.',
      keyPoints: [
        'Evangelizar Ã© a Grande ComissÃ£o dada por Jesus',
        'Todo discÃ­pulo deve ser um evangelista',
        'Devemos pregar com a vida e com as palavras',
        'Ser testemunha comeÃ§a onde vocÃª estÃ¡',
        'O EspÃ­rito Santo nos capacita para evangelizar',
      ],
      reflection: [
        'Quando foi a Ãºltima vez que vocÃª compartilhou o evangelho?',
        'Quem sÃ£o as pessoas que Deus colocou em seu caminho?',
        'Como vocÃª pode evangelizar no seu dia a dia?',
      ],
    },
  ],

  cycle2: [
    {
      id: 'c2_01',
      number: 1,
      title: 'O DiscÃ­pulo e a Comunidade',
      theme: 'Vida CristÃ£ PrÃ¡tica',
      icon: 'ðŸ¤',
      verses: ['Atos 2:42-47', 'Hebreus 10:25', 'Romanos 12:10'],
      summary: 'A vida em comunidade Ã© essencial para o cristÃ£o. Fomos chamados para viver em comunhÃ£o, servindo e sendo servidos. A igreja Ã© uma famÃ­lia espiritual onde nos fortalecemos mutuamente.',
      keyPoints: [
        'Fomos criados para viver em comunidade',
        'NÃ£o devemos abandonar nossa congregaÃ§Ã£o',
        'Na comunidade exercitamos o amor prÃ¡tico',
        'Devemos servir uns aos outros com nossos dons',
        'A comunhÃ£o fortalece a fÃ© e protege contra o isolamento',
      ],
      reflection: [
        'Como estÃ¡ seu envolvimento com a comunidade da fÃ©?',
        'De que forma vocÃª pode servir mais na igreja?',
        'VocÃª tem cultivado relacionamentos saudÃ¡veis na fÃ©?',
      ],
    },
    {
      id: 'c2_02',
      number: 2,
      title: 'O DiscÃ­pulo e o Lar CristÃ£o',
      theme: 'Vida CristÃ£ PrÃ¡tica',
      icon: 'ðŸ ',
      verses: ['JosuÃ© 24:15', 'EfÃ©sios 5:25-28', 'ProvÃ©rbios 22:6'],
      summary: 'O lar cristÃ£o Ã© o primeiro lugar de discipulado. A famÃ­lia Ã© instituiÃ§Ã£o divina onde o amor, o respeito e os valores do Reino devem ser vividos e ensinados diariamente.',
      keyPoints: [
        'A famÃ­lia Ã© a primeira instituiÃ§Ã£o criada por Deus',
        'O lar deve ser um lugar de oraÃ§Ã£o e ensino',
        'Os pais sÃ£o responsÃ¡veis pela educaÃ§Ã£o espiritual dos filhos',
        'O casamento deve refletir o amor de Cristo pela Igreja',
        'Devemos escolher servir ao Senhor em nosso lar',
      ],
      reflection: [
        'Como estÃ¡ a vida espiritual do seu lar?',
        'VocÃª tem dedicado tempo para orar com sua famÃ­lia?',
        'De que forma seu lar reflete os valores cristÃ£os?',
      ],
    },
    {
      id: 'c2_03',
      number: 3,
      title: 'O DiscÃ­pulo e a TentaÃ§Ã£o',
      theme: 'Vida CristÃ£ PrÃ¡tica',
      icon: 'âš”ï¸',
      verses: ['1 CorÃ­ntios 10:13', 'Tiago 1:12-15', 'Mateus 26:41'],
      summary: 'A tentaÃ§Ã£o faz parte da vida cristÃ£, mas Deus Ã© fiel e nÃ£o permite que sejamos tentados alÃ©m do que podemos suportar. Devemos vigiar e orar para nÃ£o cair em tentaÃ§Ã£o.',
      keyPoints: [
        'TentaÃ§Ã£o nÃ£o Ã© pecado, ceder a ela Ã©',
        'Deus nÃ£o nos tenta, mas permite provas',
        'Ele sempre providencia uma saÃ­da',
        'Devemos vigiar e orar contra a tentaÃ§Ã£o',
        'A Palavra de Deus Ã© nossa arma contra a tentaÃ§Ã£o',
      ],
      reflection: [
        'Quais sÃ£o suas maiores Ã¡reas de tentaÃ§Ã£o?',
        'Como vocÃª tem resistido Ã s tentaÃ§Ãµes?',
        'Que estratÃ©gias bÃ­blicas vocÃª pode adotar?',
      ],
    },
    {
      id: 'c2_04',
      number: 4,
      title: 'O DiscÃ­pulo e a Impureza',
      theme: 'Santidade',
      icon: 'ðŸªž',
      verses: ['1 Tessalonicenses 4:3-7', 'Mateus 5:8', '1 JoÃ£o 1:9'],
      summary: 'Deus nos chamou para a santidade e pureza. Devemos fugir da impureza e buscar uma vida de santificaÃ§Ã£o, guardando nosso coraÃ§Ã£o, mente e corpo para a glÃ³ria de Deus.',
      keyPoints: [
        'A vontade de Deus Ã© nossa santificaÃ§Ã£o',
        'Devemos fugir da impureza em todas as formas',
        'Guardar o coraÃ§Ã£o, a mente e o corpo',
        'Bem-aventurados os puros de coraÃ§Ã£o',
        'Se confessarmos, Ele Ã© fiel para nos purificar',
      ],
      reflection: [
        'HÃ¡ Ã¡reas da sua vida que precisam de purificaÃ§Ã£o?',
        'Como guardar sua mente e coraÃ§Ã£o da impureza?',
        'Qual o papel da confissÃ£o na busca pela pureza?',
      ],
    },
    {
      id: 'c2_05',
      number: 5,
      title: 'O DiscÃ­pulo e a Idolatria',
      theme: 'Santidade',
      icon: 'ðŸš«',
      verses: ['ÃŠxodo 20:3-5', '1 JoÃ£o 5:21', 'Colossenses 3:5'],
      summary: 'Idolatria Ã© colocar qualquer coisa no lugar de Deus em nosso coraÃ§Ã£o. NÃ£o se limita a imagens â€” pode ser dinheiro, pessoas, status ou qualquer coisa que ocupe o lugar que pertence a Deus.',
      keyPoints: [
        'O primeiro mandamento: nÃ£o ter outros deuses',
        'Idolatria vai alÃ©m de imagens fÃ­sicas',
        'Tudo que ocupa o lugar de Deus Ã© Ã­dolo',
        'Devemos guardar nosso coraÃ§Ã£o de toda forma de idolatria',
        'Somente Deus Ã© digno de adoraÃ§Ã£o',
      ],
      reflection: [
        'HÃ¡ algo ocupando o lugar de Deus em sua vida?',
        'Quais sÃ£o os Ã­dolos modernos que nos afetam?',
        'Como manter Deus em primeiro lugar sempre?',
      ],
    },
    {
      id: 'c2_06',
      number: 6,
      title: 'O DiscÃ­pulo e a TemperanÃ§a',
      theme: 'CarÃ¡ter CristÃ£o',
      icon: 'âš–ï¸',
      verses: ['GÃ¡latas 5:23', '1 CorÃ­ntios 9:25-27', 'ProvÃ©rbios 25:28'],
      summary: 'TemperanÃ§a Ã© domÃ­nio prÃ³prio, autocontrole em todas as Ã¡reas da vida. Ã‰ um fruto do EspÃ­rito que nos capacita a viver de forma equilibrada e disciplinada.',
      keyPoints: [
        'TemperanÃ§a Ã© domÃ­nio prÃ³prio e autocontrole',
        'Ã‰ um fruto do EspÃ­rito Santo',
        'Sem domÃ­nio prÃ³prio somos como cidade sem muros',
        'Devemos disciplinar nosso corpo e mente',
        'O equilÃ­brio em tudo Ã© sinal de maturidade',
      ],
      reflection: [
        'Em quais Ã¡reas vocÃª precisa de mais domÃ­nio prÃ³prio?',
        'Como a temperanÃ§a pode melhorar seus relacionamentos?',
        'Que hÃ¡bitos saudÃ¡veis vocÃª pode desenvolver?',
      ],
    },
    {
      id: 'c2_07',
      number: 7,
      title: 'O DiscÃ­pulo e o PerdÃ£o',
      theme: 'Vida CristÃ£ PrÃ¡tica',
      icon: 'ðŸ’',
      verses: ['Mateus 6:14-15', 'EfÃ©sios 4:32', 'Colossenses 3:13'],
      summary: 'O perdÃ£o Ã© central na vida cristÃ£. Assim como Cristo nos perdoou, devemos perdoar uns aos outros. O perdÃ£o liberta tanto quem perdoa quanto quem Ã© perdoado.',
      keyPoints: [
        'Fomos perdoados por Cristo, devemos perdoar',
        'O perdÃ£o Ã© uma decisÃ£o, nÃ£o um sentimento',
        'NÃ£o perdoar aprisiona e adoece',
        'Perdoar nÃ£o significa concordar ou esquecer',
        'O perdÃ£o abre caminho para a cura e restauraÃ§Ã£o',
      ],
      reflection: [
        'HÃ¡ alguÃ©m que vocÃª precisa perdoar?',
        'VocÃª jÃ¡ pediu perdÃ£o a alguÃ©m que magoou?',
        'Como o perdÃ£o de Cristo impacta sua vida?',
      ],
    },
    {
      id: 'c2_08',
      number: 8,
      title: 'O DiscÃ­pulo e a Mordomia CristÃ£',
      theme: 'ServiÃ§o',
      icon: 'ðŸ”‘',
      verses: ['1 Pedro 4:10', 'Mateus 25:14-30', 'Lucas 16:10'],
      summary: 'Mordomia cristÃ£ Ã© administrar fielmente tudo que Deus nos confiou: tempo, talentos, dons e recursos. Somos mordomos, nÃ£o donos. Devemos ser fiÃ©is no pouco para receber o muito.',
      keyPoints: [
        'Somos mordomos dos recursos de Deus',
        'Devemos administrar tempo, talentos e bens com fidelidade',
        'Quem Ã© fiel no pouco, serÃ¡ sobre o muito',
        'Cada dom recebido deve ser usado para servir',
        'Prestaremos contas da nossa mordomia',
      ],
      reflection: [
        'Como vocÃª tem administrado seus talentos?',
        'Seu tempo tem sido dedicado ao que realmente importa?',
        'De que forma vocÃª pode ser um mordomo mais fiel?',
      ],
    },
    {
      id: 'c2_09',
      number: 9,
      title: 'O DiscÃ­pulo e o Louvor',
      theme: 'AdoraÃ§Ã£o',
      icon: 'ðŸŽµ',
      verses: ['Salmos 150:6', 'JoÃ£o 4:23-24', 'Colossenses 3:16'],
      summary: 'O louvor e a adoraÃ§Ã£o sÃ£o expressÃµes do nosso amor a Deus. Adorar em espÃ­rito e verdade Ã© o que o Pai busca. O louvor nÃ£o depende de circunstÃ¢ncias, Ã© um estilo de vida.',
      keyPoints: [
        'Deus busca verdadeiros adoradores',
        'Adorar em espÃ­rito e em verdade',
        'O louvor Ã© uma arma espiritual poderosa',
        'Tudo que tem fÃ´lego louve ao Senhor',
        'O louvor Ã© um estilo de vida, nÃ£o apenas um momento',
      ],
      reflection: [
        'O louvor faz parte do seu dia a dia?',
        'VocÃª consegue louvar mesmo nos momentos difÃ­ceis?',
        'Como o louvor tem transformado sua vida?',
      ],
    },
    {
      id: 'c2_10',
      number: 10,
      title: 'O DiscÃ­pulo e o Batismo nas Ãguas',
      theme: 'OrdenanÃ§as',
      icon: 'ðŸŒŠ',
      verses: ['Mateus 28:19', 'Atos 2:38', 'Romanos 6:3-4'],
      summary: 'O batismo nas Ã¡guas Ã© uma ordenanÃ§a de Jesus Cristo. Ã‰ um ato pÃºblico de fÃ© que simboliza a morte do velho homem e o nascimento da nova vida em Cristo.',
      keyPoints: [
        'O batismo Ã© uma ordenanÃ§a de Jesus',
        'Simboliza morte e ressurreiÃ§Ã£o com Cristo',
        'Ã‰ um testemunho pÃºblico de fÃ©',
        'Deve ser por imersÃ£o, conforme o modelo bÃ­blico',
        'Ã‰ passo de obediÃªncia apÃ³s a conversÃ£o',
      ],
      reflection: [
        'VocÃª jÃ¡ foi batizado nas Ã¡guas?',
        'O que o batismo representa para sua vida?',
        'VocÃª estÃ¡ preparado para dar esse passo de fÃ©?',
      ],
    },
    {
      id: 'c2_11',
      number: 11,
      title: 'O DiscÃ­pulo e a Santa Ceia',
      theme: 'OrdenanÃ§as',
      icon: 'ðŸž',
      verses: ['1 CorÃ­ntios 11:23-26', 'Lucas 22:19-20', 'Mateus 26:26-28'],
      summary: 'A Santa Ceia Ã© uma ordenanÃ§a de Jesus para a Igreja. O pÃ£o representa o corpo de Cristo e o vinho (suco) representa o sangue de Cristo. Ã‰ um momento de comunhÃ£o, memÃ³ria e proclamaÃ§Ã£o.',
      keyPoints: [
        'A Santa Ceia foi instituÃ­da por Jesus',
        'O pÃ£o simboliza o corpo de Cristo partido por nÃ³s',
        'O cÃ¡lice simboliza o sangue da Nova AlianÃ§a',
        'Fazemos em memÃ³ria de Cristo atÃ© que Ele volte',
        'Devemos nos examinar antes de participar',
      ],
      reflection: [
        'Qual o significado da Santa Ceia para vocÃª?',
        'VocÃª se prepara espiritualmente para participar?',
        'Como esse momento fortalece sua fÃ©?',
      ],
    },
    {
      id: 'c2_12',
      number: 12,
      title: 'O DiscÃ­pulo e a Volta de Jesus',
      theme: 'Escatologia',
      icon: 'ðŸ‘‘',
      verses: ['1 Tessalonicenses 4:16-17', 'Mateus 24:36', 'Apocalipse 22:20'],
      summary: 'Jesus prometeu que voltarÃ¡ para buscar Sua Igreja. A segunda vinda de Cristo Ã© a esperanÃ§a do cristÃ£o. Devemos estar preparados, pois ninguÃ©m sabe o dia nem a hora.',
      keyPoints: [
        'Jesus prometeu que voltarÃ¡',
        'NinguÃ©m sabe o dia nem a hora',
        'Os mortos em Cristo ressuscitarÃ£o primeiro',
        'Seremos arrebatados para encontrar o Senhor',
        'Devemos viver em estado de prontidÃ£o',
      ],
      reflection: [
        'VocÃª estÃ¡ preparado para a volta de Jesus?',
        'Como essa esperanÃ§a influencia sua vida diÃ¡ria?',
        'O que vocÃª gostaria de estar fazendo quando Ele voltar?',
      ],
    },
    {
      id: 'c2_13',
      number: 13,
      title: 'O DiscÃ­pulo e a MissÃ£o de Discipular',
      theme: 'MultiplicaÃ§Ã£o',
      icon: 'ðŸŒ±',
      verses: ['Mateus 28:19-20', '2 TimÃ³teo 2:2', 'JoÃ£o 15:16'],
      summary: 'O ciclo do discipulado se completa quando o discÃ­pulo se torna discipulador. A missÃ£o nÃ£o termina aqui â€” agora Ã© sua vez de ensinar outros o que aprendeu, multiplicando a fÃ©.',
      keyPoints: [
        'Discipulado Ã© multiplicaÃ§Ã£o: cada discÃ­pulo faz novos discÃ­pulos',
        'O que aprendeu, ensine a outros fiÃ©is',
        'Jesus escolheu seus discÃ­pulos para que produzissem fruto',
        'Sua histÃ³ria de transformaÃ§Ã£o Ã© sua maior ferramenta',
        'O ciclo continua: vocÃª agora Ã© um discipulador',
      ],
      reflection: [
        'VocÃª se sente preparado para discipular alguÃ©m?',
        'Quem Deus tem colocado em seu caminho para discipular?',
        'Como vocÃª pode comeÃ§ar a multiplicar o que aprendeu?',
      ],
    },
  ],

  // Transversal themes / workshops
  workshops: [
    { id: 'w01', title: 'Criacionismo', icon: 'ðŸŒ' },
    { id: 'w02', title: 'Cristo', icon: 'âœï¸' },
    { id: 'w03', title: 'Doutrinas BÃ­blicas', icon: 'ðŸ“š' },
    { id: 'w04', title: 'CarÃ¡ter, Personalidade e Temperamento CristÃ£o', icon: 'ðŸ§ ' },
    { id: 'w05', title: 'FinanÃ§as', icon: 'ðŸ’°' },
    { id: 'w06', title: 'EspÃ­rito Santo', icon: 'ðŸ”¥' },
    { id: 'w07', title: 'Feminismo X Machismo X Comunismo X Relativismo', icon: 'âš–ï¸' },
    { id: 'w08', title: 'Sexualidade: PadrÃ£o CristÃ£o', icon: 'ðŸ’‘' },
    { id: 'w09', title: 'Pecado', icon: 'âš ï¸' },
    { id: 'w10', title: 'LibertaÃ§Ã£o', icon: 'â›“ï¸' },
    { id: 'w11', title: 'Misticismo / Egolatria / Apostasia', icon: 'ðŸš«' },
    { id: 'w12', title: 'Chamado e VocaÃ§Ã£o', icon: 'ðŸ“¢' },
    { id: 'w13', title: 'Falsos Mestres e Falsas Doutrinas', icon: 'ðŸ”' },
  ],
};

// ============================================
// Utility Functions
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function formatDateFile() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDatetime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrÃ¡s`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrÃ¡s`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrÃ¡s`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} semanas atrÃ¡s`;
  return formatDate(dateStr);
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'âœ…', error: 'âŒ', warning: 'âš ï¸', info: 'â„¹ï¸' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'âœ…'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
}

function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => nav.classList.remove('open'));
    });
  }
}

function initSidebar() {
  const btn = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabBar => {
    const tabs = tabBar.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const parent = tabBar.parentElement;
        parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = parent.querySelector(`#${target}`);
        if (content) content.classList.add('active');
      });
    });
  });
}

const CalendarManager = {
  getCalendar() {
    return DB.getAll(DB.KEYS.CALENDAR) || [];
  },
  saveCalendar(schedule) {
    DB.save(DB.KEYS.CALENDAR, schedule);
  }
};

// Initialize DB on load
DB.init();
// ============================================
// ContentManager (AVA: Materiais, Vídeos, Avisos)
// ============================================
const ContentManager = {
  getAll() {
    return DB.getAll(DB.KEYS.CONTENTS) || [];
  },
  getByDiscipline(disciplineId) {
    return this.getAll()
      .filter(c => c.disciplineId === disciplineId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  add(contentData) {
    const newContent = {
      ...contentData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    DB.add(DB.KEYS.CONTENTS, newContent);
    return newContent;
  },
  remove(id) {
    const contents = this.getAll().filter(c => c.id !== id);
    DB.save(DB.KEYS.CONTENTS, contents);
  }
};

// ============================================
// GradeManager (AVA: Notas e Avaliações)
// ============================================
const GradeManager = {
  getAll() {
    return DB.getAll(DB.KEYS.GRADES) || [];
  },
  getByDiscipline(disciplineId) {
    return this.getAll().filter(g => g.disciplineId === disciplineId);
  },
  getByStudent(studentId) {
    return this.getAll().filter(g => g.studentId === studentId);
  },
  saveGrade(studentId, disciplineId, assessmentName, gradeValue) {
    const grades = this.getAll();
    const index = grades.findIndex(g => g.studentId === studentId && g.disciplineId === disciplineId && g.assessmentName === assessmentName);
    if (index >= 0) {
      grades[index].grade = gradeValue;
      grades[index].updatedAt = new Date().toISOString();
    } else {
      grades.push({
        id: generateId(),
        studentId,
        disciplineId,
        assessmentName,
        grade: gradeValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    DB.save(DB.KEYS.GRADES, grades);
  },
  removeGrade(id) {
    const grades = this.getAll().filter(g => g.id !== id);
    DB.save(DB.KEYS.GRADES, grades);
  }
};

window.ContentManager = ContentManager;
window.GradeManager = GradeManager;
