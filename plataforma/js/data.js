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
        address: 'Rua das Mangueiras, 19 – Novo Horizonte',
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
    // Provisório: para o portal reconhecer o professor, podemos usar um código de acesso também
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
      Endereço: s.address || '',
      'Data de Conversão': s.conversionDate ? formatDate(s.conversionDate) : '',
      'Quem Evangelizou': s.evangelizedBy || '',
      Apadrinhador: s.sponsor || '',
      Status: s.status || '',
      'Código de Acesso': s.accessCode || '',
      'Lições Concluídas': s.completedLessons?.length || 0,
      'Progresso (%)': StudentManager.getProgress(s.id),
      'Frequência (%)': AttendanceManager.getAttendanceRate(s.id),
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
        Presente: a.present ? 'Sim' : 'Não',
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
    return `Olá, ${name}! 🙏\n\nSeja muito bem-vindo(a) à *Assembleia de Deus CML CAB*!\n\nEstamos muito felizes pela sua decisão de seguir a Jesus Cristo. Você foi inscrito(a) no nosso programa de *Discipulado*, onde iremos caminhar juntos nessa jornada de fé.\n\nPrepare seu coração! Em breve entraremos em contato com mais informações.\n\n*"Uns plantam, outros regam; mas Deus dá o crescimento"* - 1 Co 3:6\n\nDeus abençoe! ✝️`;
  },

  reminder(name, topic, date, time) {
    return `Olá, ${name}! 📖\n\nLembramos que nosso encontro de *Discipulado* está chegando:\n\n📅 *Data:* ${date}\n⏰ *Horário:* ${time}\n📚 *Tema:* ${topic}\n\nSua presença é muito importante! Estamos preparando tudo com carinho.\n\nDeus abençoe! 🙏`;
  },

  congratsLesson(name, lesson) {
    return `Parabéns, ${name}! 🎉\n\nVocê concluiu mais uma lição do Discipulado:\n📚 *${lesson}*\n\nContinue firme nessa caminhada! Cada passo é um avanço no seu crescimento espiritual.\n\n*"Eu plantei, Apolo regou; mas Deus dá o crescimento."* - 1 Co 3:6\n\nDeus abençoe! ✝️`;
  },

  congratsGraduation(name) {
    return `🎓 *PARABÉNS, ${name}!* 🎓\n\nVocê concluiu o programa de *Discipulado* da Assembleia de Deus CML CAB!\n\nFoi uma jornada incrível de aprendizado e crescimento espiritual. Estamos muito orgulhosos de você!\n\nSeu certificado está sendo preparado. 📜\n\n*"Combati o bom combate, acabei a carreira, guardei a fé."* - 2 Tm 4:7\n\nDeus abençoe sua caminhada! ✝️🙏`;
  },

  missingStudent(name, weeks) {
    return `Olá, ${name}! 🙏\n\nSentimos sua falta nos encontros de *Discipulado*! Já se passaram ${weeks} semanas desde sua última presença.\n\nSabemos que a vida pode ser corrida, mas queremos que saiba que você faz parte desta família e sua presença é muito importante para nós.\n\nPodemos ajudar em algo? Estamos aqui por você!\n\nDeus abençoe! ✝️`;
  },

  birthday(name) {
    return `🎂 *Feliz Aniversário, ${name}!* 🎉\n\nHoje é um dia especial! Que Deus abençoe sua vida com muita saúde, paz e alegria.\n\n*"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti."* - Nm 6:24-25\n\nCom carinho, sua família da Assembleia de Deus CML CAB! ✝️🎂`;
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
      title: 'Conhecendo a Bíblia',
      theme: 'Fundamentos',
      icon: '📖',
      verses: ['2 Timóteo 3:16-17', 'Salmos 119:105', 'Hebreus 4:12'],
      summary: 'A Bíblia é a Palavra de Deus, inspirada pelo Espírito Santo. Ela é composta por 66 livros, divididos em Antigo e Novo Testamento. É nosso manual de fé e prática, a luz para nosso caminho e alimento espiritual diário.',
      keyPoints: [
        'A Bíblia é a Palavra inspirada por Deus',
        'São 66 livros: 39 no AT e 27 no NT',
        'É nosso guia, luz e alimento espiritual',
        'Devemos ler, estudar e meditar diariamente',
        'A Bíblia é viva e eficaz para transformar vidas',
      ],
      reflection: [
        'Você tem o hábito de ler a Bíblia diariamente?',
        'Qual versículo mais marcou sua vida até hoje?',
        'Como a Palavra de Deus pode mudar sua rotina?',
      ],
    },
    {
      id: 'c1_02',
      number: 2,
      title: 'Conhecendo Deus',
      theme: 'Fundamentos',
      icon: '✝️',
      verses: ['João 3:16', 'Êxodo 34:6-7', 'Salmos 103:8'],
      summary: 'Deus é o Criador de todas as coisas. Ele é eterno, onipotente, onisciente e onipresente. Seu maior atributo é o amor. Ele se revela como Pai, Filho e Espírito Santo — a Santíssima Trindade.',
      keyPoints: [
        'Deus é o Criador de tudo que existe',
        'Ele é eterno, todo-poderoso e sabe todas as coisas',
        'Deus é amor e nos amou primeiro',
        'Ele se revela como Trindade: Pai, Filho e Espírito Santo',
        'Podemos ter um relacionamento pessoal com Ele',
      ],
      reflection: [
        'O que significa para você saber que Deus é amor?',
        'Como você descreveria Deus para alguém que não O conhece?',
        'De que forma Deus tem se revelado em sua vida?',
      ],
    },
    {
      id: 'c1_03',
      number: 3,
      title: 'Conhecendo a Salvação',
      theme: 'Fundamentos',
      icon: '🕊️',
      verses: ['Romanos 10:9-10', 'Efésios 2:8-9', 'Atos 4:12'],
      summary: 'A salvação é o plano de Deus para resgatar a humanidade do pecado. Através da morte e ressurreição de Jesus Cristo, recebemos perdão e vida eterna. A salvação é pela graça, mediante a fé.',
      keyPoints: [
        'Todos pecaram e carecem da glória de Deus',
        'Jesus morreu em nosso lugar na cruz',
        'A salvação é pela graça, mediante a fé',
        'Não é por obras, para que ninguém se glorie',
        'Quem crê e confessa a Jesus é salvo',
      ],
      reflection: [
        'Você já teve um encontro pessoal com Jesus?',
        'O que a salvação significa na sua vida prática?',
        'Como você pode compartilhar essa mensagem com outros?',
      ],
    },
    {
      id: 'c1_04',
      number: 4,
      title: 'Conhecendo a Igreja',
      theme: 'Fundamentos',
      icon: '⛪',
      verses: ['Mateus 16:18', 'Atos 2:42-47', '1 Coríntios 12:27'],
      summary: 'A Igreja é o Corpo de Cristo na terra, formada por todos os que creem. Não é apenas um lugar físico, mas uma comunidade de fé, amor e serviço. Congregar é fundamental para o crescimento espiritual.',
      keyPoints: [
        'A Igreja é o Corpo de Cristo',
        'Cada membro tem uma função importante',
        'Congregar fortalece a fé e o crescimento',
        'A igreja primitiva era unida em doutrina, comunhão, partir do pão e oração',
        'Devemos servir e contribuir com nossos dons',
      ],
      reflection: [
        'O que a igreja significa para você?',
        'Como você pode contribuir com a comunidade?',
        'Qual é o seu papel no Corpo de Cristo?',
      ],
    },
    {
      id: 'c1_05',
      number: 5,
      title: 'Conhecendo o Valor da Oração',
      theme: 'Fundamentos',
      icon: '🙏',
      verses: ['Filipenses 4:6-7', 'Mateus 6:9-13', '1 Tessalonicenses 5:17'],
      summary: 'A oração é a comunicação direta com Deus. É através dela que nos relacionamos com o Pai, apresentamos nossas necessidades, agradecemos e buscamos direção. Jesus nos ensinou a orar como modelo.',
      keyPoints: [
        'Orar é conversar com Deus',
        'Jesus nos ensinou o Pai Nosso como modelo',
        'Devemos orar sem cessar, em todo tempo',
        'A oração traz paz e fortalece a fé',
        'Podemos orar em qualquer lugar e momento',
      ],
      reflection: [
        'Qual é o seu hábito de oração?',
        'Você já experimentou respostas de oração?',
        'Como a oração pode transformar seu dia a dia?',
      ],
    },
    {
      id: 'c1_06',
      number: 6,
      title: 'O Discípulo e a Fé',
      theme: 'Doutrinas Bíblicas',
      icon: '🛡️',
      verses: ['Hebreus 11:1', 'Hebreus 11:6', 'Romanos 10:17'],
      summary: 'A fé é o fundamento da vida cristã. É a certeza das coisas que se esperam e a convicção de fatos que não se veem. Sem fé é impossível agradar a Deus. A fé vem pelo ouvir a Palavra.',
      keyPoints: [
        'Fé é certeza e convicção no invisível',
        'Sem fé é impossível agradar a Deus',
        'A fé vem pelo ouvir a Palavra de Deus',
        'A fé produz obras e transforma a vida',
        'Devemos crescer na fé diariamente',
      ],
      reflection: [
        'O que é fé para você?',
        'Em quais áreas da sua vida você precisa de mais fé?',
        'Como fortalecer sua fé no dia a dia?',
      ],
    },
    {
      id: 'c1_07',
      number: 7,
      title: 'O Discípulo e a Obediência',
      theme: 'Doutrinas Bíblicas',
      icon: '📜',
      verses: ['João 14:15', '1 Samuel 15:22', 'Tiago 1:22'],
      summary: 'A obediência é fruto do amor a Deus. Jesus disse: "Se me amais, guardareis os meus mandamentos." Obedecer é melhor que sacrificar. Não basta ouvir a Palavra, é preciso praticá-la.',
      keyPoints: [
        'Obediência é demonstração de amor a Deus',
        'Obedecer é melhor que sacrificar',
        'Devemos ser praticantes da Palavra, não apenas ouvintes',
        'A obediência traz bênçãos e proteção',
        'Jesus foi obediente até a morte na cruz',
      ],
      reflection: [
        'Em que áreas da sua vida você precisa ser mais obediente?',
        'O que te impede de obedecer plenamente a Deus?',
        'Como a obediência tem transformado sua caminhada?',
      ],
    },
    {
      id: 'c1_08',
      number: 8,
      title: 'O Discípulo e o Dízimo',
      theme: 'Finanças',
      icon: '💰',
      verses: ['Malaquias 3:10', 'Mateus 23:23', '2 Coríntios 9:7'],
      summary: 'O dízimo é a décima parte de nossa renda, devolvida a Deus como ato de gratidão e fidelidade. É um princípio bíblico que demonstra nossa confiança na provisão divina.',
      keyPoints: [
        'O dízimo é a décima parte de nossa renda',
        'É um ato de fidelidade e gratidão a Deus',
        'Deus promete abrir as janelas do céu ao dizimista fiel',
        'Dar com alegria e não por obrigação',
        'As ofertas complementam o dízimo como expressão de amor',
      ],
      reflection: [
        'Você compreende o propósito bíblico do dízimo?',
        'Como a fidelidade financeira reflete sua fé?',
        'De que forma Deus tem provido em sua vida?',
      ],
    },
    {
      id: 'c1_09',
      number: 9,
      title: 'O Discípulo e o Espírito Santo',
      theme: 'Espírito Santo',
      icon: '🔥',
      verses: ['Atos 1:8', 'João 14:26', 'Romanos 8:26'],
      summary: 'O Espírito Santo é a terceira pessoa da Trindade. Ele é nosso Consolador, Guia e Mestre. Habita em todo cristão e nos capacita para viver a vida cristã e servir ao próximo.',
      keyPoints: [
        'O Espírito Santo é Deus, a terceira pessoa da Trindade',
        'Ele é o Consolador prometido por Jesus',
        'Habita em todo aquele que crê',
        'Nos guia em toda a verdade',
        'Nos capacita para o serviço cristão',
      ],
      reflection: [
        'Você reconhece a presença do Espírito Santo em sua vida?',
        'Como Ele tem te guiado nas decisões?',
        'Você busca ser cheio do Espírito Santo?',
      ],
    },
    {
      id: 'c1_10',
      number: 10,
      title: 'O Discípulo Vivendo Cheio do Espírito Santo',
      theme: 'Espírito Santo',
      icon: '💧',
      verses: ['Efésios 5:18', 'Atos 2:4', 'Gálatas 5:16'],
      summary: 'Viver cheio do Espírito Santo significa ter uma vida de rendição e comunhão com Deus. É ser guiado pelo Espírito em todas as áreas da vida, produzindo fruto e exercendo os dons.',
      keyPoints: [
        'Ser cheio do Espírito é um mandamento bíblico',
        'O batismo com o Espírito Santo é uma experiência real',
        'Andar no Espírito é viver em santidade',
        'A vida cheia do Espírito produz fruto',
        'Devemos buscar continuamente essa plenitude',
      ],
      reflection: [
        'O que significa para você ser cheio do Espírito?',
        'Como seria seu dia a dia guiado pelo Espírito?',
        'Você tem buscado essa plenitude em sua vida?',
      ],
    },
    {
      id: 'c1_11',
      number: 11,
      title: 'O Discípulo e os Dons do Espírito Santo',
      theme: 'Espírito Santo',
      icon: '🎁',
      verses: ['1 Coríntios 12:4-11', '1 Coríntios 14:1', 'Romanos 12:6-8'],
      summary: 'Os dons espirituais são capacitações sobrenaturais concedidas pelo Espírito Santo para edificação da Igreja. Cada cristão recebe pelo menos um dom para servir ao Corpo de Cristo.',
      keyPoints: [
        'Os dons são dados pelo Espírito Santo',
        'São para edificação da Igreja, não para vaidade pessoal',
        'Existem dons de revelação, poder e inspiração',
        'Cada cristão recebe dons para servir',
        'Devemos buscar os melhores dons com amor',
      ],
      reflection: [
        'Você conhece seus dons espirituais?',
        'Como você pode usar seus dons para servir a igreja?',
        'Por que o amor é mais importante que os dons?',
      ],
    },
    {
      id: 'c1_12',
      number: 12,
      title: 'O Discípulo e o Fruto do Espírito Santo',
      theme: 'Caráter Cristão',
      icon: '🍇',
      verses: ['Gálatas 5:22-23', 'João 15:5', 'Mateus 7:16-20'],
      summary: 'O fruto do Espírito é o resultado da vida cristã em comunhão com Deus: amor, alegria, paz, paciência, benignidade, bondade, fidelidade, mansidão e domínio próprio.',
      keyPoints: [
        'O fruto do Espírito tem 9 características',
        'É produzido pela comunhão com Cristo',
        'Amor, alegria, paz, paciência, benignidade',
        'Bondade, fidelidade, mansidão, domínio próprio',
        'Pelos frutos conhecemos a árvore',
      ],
      reflection: [
        'Quais frutos do Espírito são mais visíveis na sua vida?',
        'Em quais aspectos você precisa crescer mais?',
        'Como produzir mais fruto em sua caminhada?',
      ],
    },
    {
      id: 'c1_13',
      number: 13,
      title: 'O Discípulo e o Evangelismo',
      theme: 'Missões',
      icon: '📣',
      verses: ['Mateus 28:19-20', 'Marcos 16:15', 'Atos 1:8'],
      summary: 'Evangelizar é compartilhar as boas novas de salvação em Cristo Jesus. É a missão principal de todo discípulo. Jesus nos comissionou a fazer discípulos de todas as nações.',
      keyPoints: [
        'Evangelizar é a Grande Comissão dada por Jesus',
        'Todo discípulo deve ser um evangelista',
        'Devemos pregar com a vida e com as palavras',
        'Ser testemunha começa onde você está',
        'O Espírito Santo nos capacita para evangelizar',
      ],
      reflection: [
        'Quando foi a última vez que você compartilhou o evangelho?',
        'Quem são as pessoas que Deus colocou em seu caminho?',
        'Como você pode evangelizar no seu dia a dia?',
      ],
    },
  ],

  cycle2: [
    {
      id: 'c2_01',
      number: 1,
      title: 'O Discípulo e a Comunidade',
      theme: 'Vida Cristã Prática',
      icon: '🤝',
      verses: ['Atos 2:42-47', 'Hebreus 10:25', 'Romanos 12:10'],
      summary: 'A vida em comunidade é essencial para o cristão. Fomos chamados para viver em comunhão, servindo e sendo servidos. A igreja é uma família espiritual onde nos fortalecemos mutuamente.',
      keyPoints: [
        'Fomos criados para viver em comunidade',
        'Não devemos abandonar nossa congregação',
        'Na comunidade exercitamos o amor prático',
        'Devemos servir uns aos outros com nossos dons',
        'A comunhão fortalece a fé e protege contra o isolamento',
      ],
      reflection: [
        'Como está seu envolvimento com a comunidade da fé?',
        'De que forma você pode servir mais na igreja?',
        'Você tem cultivado relacionamentos saudáveis na fé?',
      ],
    },
    {
      id: 'c2_02',
      number: 2,
      title: 'O Discípulo e o Lar Cristão',
      theme: 'Vida Cristã Prática',
      icon: '🏠',
      verses: ['Josué 24:15', 'Efésios 5:25-28', 'Provérbios 22:6'],
      summary: 'O lar cristão é o primeiro lugar de discipulado. A família é instituição divina onde o amor, o respeito e os valores do Reino devem ser vividos e ensinados diariamente.',
      keyPoints: [
        'A família é a primeira instituição criada por Deus',
        'O lar deve ser um lugar de oração e ensino',
        'Os pais são responsáveis pela educação espiritual dos filhos',
        'O casamento deve refletir o amor de Cristo pela Igreja',
        'Devemos escolher servir ao Senhor em nosso lar',
      ],
      reflection: [
        'Como está a vida espiritual do seu lar?',
        'Você tem dedicado tempo para orar com sua família?',
        'De que forma seu lar reflete os valores cristãos?',
      ],
    },
    {
      id: 'c2_03',
      number: 3,
      title: 'O Discípulo e a Tentação',
      theme: 'Vida Cristã Prática',
      icon: '⚔️',
      verses: ['1 Coríntios 10:13', 'Tiago 1:12-15', 'Mateus 26:41'],
      summary: 'A tentação faz parte da vida cristã, mas Deus é fiel e não permite que sejamos tentados além do que podemos suportar. Devemos vigiar e orar para não cair em tentação.',
      keyPoints: [
        'Tentação não é pecado, ceder a ela é',
        'Deus não nos tenta, mas permite provas',
        'Ele sempre providencia uma saída',
        'Devemos vigiar e orar contra a tentação',
        'A Palavra de Deus é nossa arma contra a tentação',
      ],
      reflection: [
        'Quais são suas maiores áreas de tentação?',
        'Como você tem resistido às tentações?',
        'Que estratégias bíblicas você pode adotar?',
      ],
    },
    {
      id: 'c2_04',
      number: 4,
      title: 'O Discípulo e a Impureza',
      theme: 'Santidade',
      icon: '🪞',
      verses: ['1 Tessalonicenses 4:3-7', 'Mateus 5:8', '1 João 1:9'],
      summary: 'Deus nos chamou para a santidade e pureza. Devemos fugir da impureza e buscar uma vida de santificação, guardando nosso coração, mente e corpo para a glória de Deus.',
      keyPoints: [
        'A vontade de Deus é nossa santificação',
        'Devemos fugir da impureza em todas as formas',
        'Guardar o coração, a mente e o corpo',
        'Bem-aventurados os puros de coração',
        'Se confessarmos, Ele é fiel para nos purificar',
      ],
      reflection: [
        'Há áreas da sua vida que precisam de purificação?',
        'Como guardar sua mente e coração da impureza?',
        'Qual o papel da confissão na busca pela pureza?',
      ],
    },
    {
      id: 'c2_05',
      number: 5,
      title: 'O Discípulo e a Idolatria',
      theme: 'Santidade',
      icon: '🚫',
      verses: ['Êxodo 20:3-5', '1 João 5:21', 'Colossenses 3:5'],
      summary: 'Idolatria é colocar qualquer coisa no lugar de Deus em nosso coração. Não se limita a imagens — pode ser dinheiro, pessoas, status ou qualquer coisa que ocupe o lugar que pertence a Deus.',
      keyPoints: [
        'O primeiro mandamento: não ter outros deuses',
        'Idolatria vai além de imagens físicas',
        'Tudo que ocupa o lugar de Deus é ídolo',
        'Devemos guardar nosso coração de toda forma de idolatria',
        'Somente Deus é digno de adoração',
      ],
      reflection: [
        'Há algo ocupando o lugar de Deus em sua vida?',
        'Quais são os ídolos modernos que nos afetam?',
        'Como manter Deus em primeiro lugar sempre?',
      ],
    },
    {
      id: 'c2_06',
      number: 6,
      title: 'O Discípulo e a Temperança',
      theme: 'Caráter Cristão',
      icon: '⚖️',
      verses: ['Gálatas 5:23', '1 Coríntios 9:25-27', 'Provérbios 25:28'],
      summary: 'Temperança é domínio próprio, autocontrole em todas as áreas da vida. É um fruto do Espírito que nos capacita a viver de forma equilibrada e disciplinada.',
      keyPoints: [
        'Temperança é domínio próprio e autocontrole',
        'É um fruto do Espírito Santo',
        'Sem domínio próprio somos como cidade sem muros',
        'Devemos disciplinar nosso corpo e mente',
        'O equilíbrio em tudo é sinal de maturidade',
      ],
      reflection: [
        'Em quais áreas você precisa de mais domínio próprio?',
        'Como a temperança pode melhorar seus relacionamentos?',
        'Que hábitos saudáveis você pode desenvolver?',
      ],
    },
    {
      id: 'c2_07',
      number: 7,
      title: 'O Discípulo e o Perdão',
      theme: 'Vida Cristã Prática',
      icon: '💝',
      verses: ['Mateus 6:14-15', 'Efésios 4:32', 'Colossenses 3:13'],
      summary: 'O perdão é central na vida cristã. Assim como Cristo nos perdoou, devemos perdoar uns aos outros. O perdão liberta tanto quem perdoa quanto quem é perdoado.',
      keyPoints: [
        'Fomos perdoados por Cristo, devemos perdoar',
        'O perdão é uma decisão, não um sentimento',
        'Não perdoar aprisiona e adoece',
        'Perdoar não significa concordar ou esquecer',
        'O perdão abre caminho para a cura e restauração',
      ],
      reflection: [
        'Há alguém que você precisa perdoar?',
        'Você já pediu perdão a alguém que magoou?',
        'Como o perdão de Cristo impacta sua vida?',
      ],
    },
    {
      id: 'c2_08',
      number: 8,
      title: 'O Discípulo e a Mordomia Cristã',
      theme: 'Serviço',
      icon: '🔑',
      verses: ['1 Pedro 4:10', 'Mateus 25:14-30', 'Lucas 16:10'],
      summary: 'Mordomia cristã é administrar fielmente tudo que Deus nos confiou: tempo, talentos, dons e recursos. Somos mordomos, não donos. Devemos ser fiéis no pouco para receber o muito.',
      keyPoints: [
        'Somos mordomos dos recursos de Deus',
        'Devemos administrar tempo, talentos e bens com fidelidade',
        'Quem é fiel no pouco, será sobre o muito',
        'Cada dom recebido deve ser usado para servir',
        'Prestaremos contas da nossa mordomia',
      ],
      reflection: [
        'Como você tem administrado seus talentos?',
        'Seu tempo tem sido dedicado ao que realmente importa?',
        'De que forma você pode ser um mordomo mais fiel?',
      ],
    },
    {
      id: 'c2_09',
      number: 9,
      title: 'O Discípulo e o Louvor',
      theme: 'Adoração',
      icon: '🎵',
      verses: ['Salmos 150:6', 'João 4:23-24', 'Colossenses 3:16'],
      summary: 'O louvor e a adoração são expressões do nosso amor a Deus. Adorar em espírito e verdade é o que o Pai busca. O louvor não depende de circunstâncias, é um estilo de vida.',
      keyPoints: [
        'Deus busca verdadeiros adoradores',
        'Adorar em espírito e em verdade',
        'O louvor é uma arma espiritual poderosa',
        'Tudo que tem fôlego louve ao Senhor',
        'O louvor é um estilo de vida, não apenas um momento',
      ],
      reflection: [
        'O louvor faz parte do seu dia a dia?',
        'Você consegue louvar mesmo nos momentos difíceis?',
        'Como o louvor tem transformado sua vida?',
      ],
    },
    {
      id: 'c2_10',
      number: 10,
      title: 'O Discípulo e o Batismo nas Águas',
      theme: 'Ordenanças',
      icon: '🌊',
      verses: ['Mateus 28:19', 'Atos 2:38', 'Romanos 6:3-4'],
      summary: 'O batismo nas águas é uma ordenança de Jesus Cristo. É um ato público de fé que simboliza a morte do velho homem e o nascimento da nova vida em Cristo.',
      keyPoints: [
        'O batismo é uma ordenança de Jesus',
        'Simboliza morte e ressurreição com Cristo',
        'É um testemunho público de fé',
        'Deve ser por imersão, conforme o modelo bíblico',
        'É passo de obediência após a conversão',
      ],
      reflection: [
        'Você já foi batizado nas águas?',
        'O que o batismo representa para sua vida?',
        'Você está preparado para dar esse passo de fé?',
      ],
    },
    {
      id: 'c2_11',
      number: 11,
      title: 'O Discípulo e a Santa Ceia',
      theme: 'Ordenanças',
      icon: '🍞',
      verses: ['1 Coríntios 11:23-26', 'Lucas 22:19-20', 'Mateus 26:26-28'],
      summary: 'A Santa Ceia é uma ordenança de Jesus para a Igreja. O pão representa o corpo de Cristo e o vinho (suco) representa o sangue de Cristo. É um momento de comunhão, memória e proclamação.',
      keyPoints: [
        'A Santa Ceia foi instituída por Jesus',
        'O pão simboliza o corpo de Cristo partido por nós',
        'O cálice simboliza o sangue da Nova Aliança',
        'Fazemos em memória de Cristo até que Ele volte',
        'Devemos nos examinar antes de participar',
      ],
      reflection: [
        'Qual o significado da Santa Ceia para você?',
        'Você se prepara espiritualmente para participar?',
        'Como esse momento fortalece sua fé?',
      ],
    },
    {
      id: 'c2_12',
      number: 12,
      title: 'O Discípulo e a Volta de Jesus',
      theme: 'Escatologia',
      icon: '👑',
      verses: ['1 Tessalonicenses 4:16-17', 'Mateus 24:36', 'Apocalipse 22:20'],
      summary: 'Jesus prometeu que voltará para buscar Sua Igreja. A segunda vinda de Cristo é a esperança do cristão. Devemos estar preparados, pois ninguém sabe o dia nem a hora.',
      keyPoints: [
        'Jesus prometeu que voltará',
        'Ninguém sabe o dia nem a hora',
        'Os mortos em Cristo ressuscitarão primeiro',
        'Seremos arrebatados para encontrar o Senhor',
        'Devemos viver em estado de prontidão',
      ],
      reflection: [
        'Você está preparado para a volta de Jesus?',
        'Como essa esperança influencia sua vida diária?',
        'O que você gostaria de estar fazendo quando Ele voltar?',
      ],
    },
    {
      id: 'c2_13',
      number: 13,
      title: 'O Discípulo e a Missão de Discipular',
      theme: 'Multiplicação',
      icon: '🌱',
      verses: ['Mateus 28:19-20', '2 Timóteo 2:2', 'João 15:16'],
      summary: 'O ciclo do discipulado se completa quando o discípulo se torna discipulador. A missão não termina aqui — agora é sua vez de ensinar outros o que aprendeu, multiplicando a fé.',
      keyPoints: [
        'Discipulado é multiplicação: cada discípulo faz novos discípulos',
        'O que aprendeu, ensine a outros fiéis',
        'Jesus escolheu seus discípulos para que produzissem fruto',
        'Sua história de transformação é sua maior ferramenta',
        'O ciclo continua: você agora é um discipulador',
      ],
      reflection: [
        'Você se sente preparado para discipular alguém?',
        'Quem Deus tem colocado em seu caminho para discipular?',
        'Como você pode começar a multiplicar o que aprendeu?',
      ],
    },
  ],

  // Transversal themes / workshops
  workshops: [
    { id: 'w01', title: 'Criacionismo', icon: '🌍' },
    { id: 'w02', title: 'Cristo', icon: '✝️' },
    { id: 'w03', title: 'Doutrinas Bíblicas', icon: '📚' },
    { id: 'w04', title: 'Caráter, Personalidade e Temperamento Cristão', icon: '🧠' },
    { id: 'w05', title: 'Finanças', icon: '💰' },
    { id: 'w06', title: 'Espírito Santo', icon: '🔥' },
    { id: 'w07', title: 'Feminismo X Machismo X Comunismo X Relativismo', icon: '⚖️' },
    { id: 'w08', title: 'Sexualidade: Padrão Cristão', icon: '💑' },
    { id: 'w09', title: 'Pecado', icon: '⚠️' },
    { id: 'w10', title: 'Libertação', icon: '⛓️' },
    { id: 'w11', title: 'Misticismo / Egolatria / Apostasia', icon: '🚫' },
    { id: 'w12', title: 'Chamado e Vocação', icon: '📢' },
    { id: 'w13', title: 'Falsos Mestres e Falsas Doutrinas', icon: '🔍' },
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
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} semanas atrás`;
  return formatDate(dateStr);
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
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
// ContentManager (AVA: Materiais, V�deos, Avisos)
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
// GradeManager (AVA: Notas e Avalia��es)
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
