// Генерация случайного кода комнаты
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Предзагруженные карты
export const professions = [
  'Врач', 'Учитель', 'Инженер', 'Повар', 'Пожарный',
  'Программист', 'Фермер', 'Строитель', 'Водитель', 'Ученый',
  'Художник', 'Музыкант', 'Спортсмен', 'Психолог', 'Юрист'
]

export const ages = [18, 25, 30, 35, 40, 45, 50, 55, 60, 65]

export const genders = ['Мужской', 'Женский', 'Другой']

export const healthStatuses = [
  'Отличное здоровье',
  'Хорошее здоровье',
  'Среднее здоровье',
  'Слабое здоровье',
  'Хроническое заболевание',
  'Инвалидность'
]

export const hobbies = [
  'Чтение', 'Спорт', 'Музыка', 'Кулинария', 'Садоводство',
  'Рыбалка', 'Охота', 'Фотография', 'Рисование', 'Программирование',
  'Путешествия', 'Коллекционирование', 'Игры', 'Танцы', 'Пение'
]

export const baggage = [
  'Еда на месяц', 'Медикаменты', 'Инструменты', 'Книги',
  'Оружие', 'Семена растений', 'Генератор', 'Радио',
  'Карты местности', 'Аптечка', 'Вода', 'Одежда',
  'Спальник', 'Фонарик', 'Батарейки', 'Спички'
]

export const phobias = [
  'Клаустрофобия', 'Арахнофобия', 'Аквафобия', 'Акрофобия',
  'Никтофобия', 'Социофобия', 'Танатофобия', 'Агорафобия'
]

export const facts = [
  'Бывший военный', 'Знает несколько языков', 'Имеет детей',
  'Ветеринар', 'Бывший заключенный', 'Аллергия на пыль',
  'Вегетарианец', 'Курит', 'Алкоголик', 'Беременна',
  'Пожилой человек', 'Подросток', 'Имеет собаку', 'Одиночка'
]

// Генерация случайной карты
export function generateRandomCard() {
  return {
    profession: professions[Math.floor(Math.random() * professions.length)],
    age: ages[Math.floor(Math.random() * ages.length)],
    gender: genders[Math.floor(Math.random() * genders.length)],
    health: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
    hobby: hobbies[Math.floor(Math.random() * hobbies.length)],
    baggage: baggage[Math.floor(Math.random() * baggage.length)],
    phobia: phobias[Math.floor(Math.random() * phobias.length)],
    fact: facts[Math.floor(Math.random() * facts.length)],
  }
}

// Форматирование времени
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

