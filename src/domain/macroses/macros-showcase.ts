import { MacrosType } from './macros';

export const macrosShowcase = {
  [MacrosType.LIGHTING]: {
    name: 'Освещение',
    description: 'Позволяет управлять освещением как релейно так и RGBW лентами.',
  },
  [MacrosType.CURTAINS_OPENING]: {
    name: 'Открывание штор',
    description: 'Позволяет релейно и порционно управлять шторами.',
  },
  [MacrosType.HEATING]: {
    name: 'Отопление',
    description:
      'Позволяет управлять нагревом поверхностей пола, стен, уличных дорожек, воздуха в помещениях,' +
      ' воздуха в системе вентиляции. По средством управления котлами, насосными узлами, ' +
      'термостатическими приводами, смесительными устройствами.',
  },
  [MacrosType.WATER_SUPPLY]: {
    name: 'Водоснабжение',
    description:
      'Позволяет управлять системой горячего и холодного водоснабжения, циркуляцией ГВС,' +
      ' защитой от протечек, учет расхода холодной воды.' +
      'По средством управления насосами, кранами, и контролем показаний счетчиков.',
  },
  [MacrosType.HEATED_TOWEL_RAILS]: {
    name: 'Полотенце сушители',
    description:
      'Позволяет управлять полотенце сушителями.' +
      'По средством релейного управления линиями электрических нагревателей.',
  },
  [MacrosType.VENTILATION]: {
    name: 'Вентиляция',
    description:
      'Позволяет управлять качеством воздуха в помещениях.' +
      'По средством управления вентиляторами, приводами задвижек, системой отопления.',
  },
  [MacrosType.HUMIDIFICATION]: {
    name: 'Увлажнение',
    description:
      'Позволяет управлять влажностью воздуха в помещениях.' +
      'по средством релейного управления увлажнителями воздуха, ' +
      'либо релейного управления стационарной системой увлажнения.',
  },
  [MacrosType.CONDITIONING]: {
    name: 'Кондиционирование',
    description: 'Позволяет управлять процессом охлаждения и нагрева воздуха в помещениях по средством кондиционеров.',
  },
  [MacrosType.HEATING_CABLE]: {
    name: 'Греющий кабель',
    description: 'Позволяет релейно управлять греющим кабелем. Может быть использована для различных целей.',
  },
  [MacrosType.GATE_OPENING]: {
    name: 'Открывание ворот',
    description: 'Позволяет релейно и/или по modbus управлять управлять открыванием ворот, рольставней.',
  },
  [MacrosType.SECURITY]: {
    name: 'Безопасность',
    description: 'Позволяет узнать о открытии дверей и окон.',
  },
  [MacrosType.ACCOUNTING]: {
    name: 'Учет',
    description:
      'Позволяет вести учет электричества, воды, газа, тепла.' + 'По средством подключения импульсных средств учета.',
  },
  [MacrosType.AUTOMATIC_RESERVE_ENTRY]: {
    name: 'Автоматический ввод резерва',
    description:
      'Позволяет автоматически переключить электроснабжение с сетевого на генератор.' +
      'При появлении сети переключиться обратно на сеть.' +
      'Позволяет отслеживать количества топлива в генераторе, ' +
      'через потребляемую мощность и паспортные данные генератора.',
  },
  [MacrosType.MASTER_SWITCH]: {
    name: 'Мастер выключатель',
    description: 'Позволяет отключать линии которые не используются без пользователей.',
  },
};