/* eslint-disable unicorn/no-empty-file */
import debug from 'debug';
import defaultsDeep from 'lodash.defaultsdeep';

import { stringify } from '../../../helpers/json-stringify';
import { ControlType } from '../../control-type';
import { Macros, MacrosParameters } from '../macros';
import { MacrosType } from '../showcase';

const logger = debug('hyperion:macros:cover');

/**
 * ! SETTINGS
 */

/**
 * Состояние переключателя (реле, кнопка, виртуальная кнопка, геркон).
 */
export enum Switch {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Определяет по верхнему ("1", +5, true) или по нижнему ("0", 0, false) уровню случится реакция.
 */
export enum Trigger {
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Правило определения числового значения по нескольким датчикам
 * MAX - берем максимальное среди всех
 * MIN - берем минимальное среди всех
 * AVG - берем среднее среди всех
 */
export enum LevelDetection {
  MAX = 'MAX',
  MIN = 'MIN',
  AVG = 'AVG',
}

/**
 * Тип .
 */
export enum CloseByTimeDirection {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
}

/**
 * Типы блокировок.
 */
export enum BlockType {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  ALL = 'ALL',
}

/**
 * ! Cover macros scenarios
 *
 * В описание роль крышки будет играть штора, но вместо шторы могут быть любые другие
 *  устройства типа Cover https://www.zigbee2mqtt.io/guide/usage/exposes.html#specific
 *
 * Шторы управляются при помощи:
 *  Кнопок
 *  Виртуальная кнопка (дает возможность управлять через приложение)
 *  Герконов
 *  Освещенности
 *  Движения
 *  Шума
 *  Температуре
 *  Времени
 *
 * * 1. Открыть/Закрыть/Остановить через кнопку либо через реальную либо через виртуальную.
 *  Классический способ переключать состояние шторы, при котором нужно нажимать на кнопку.
 *
 *  Способ является приоритетным над всеми остальными, и выставляет блокировку на изменения состояния,
 *    на заданное время.
 *  То есть в случае открывания/закрывания кнопкой, штора в любом случае изменит состояние, и автоматические
 *    действия будут заблокированы на время указанное в настройках.
 *
 * Чтобы реализовать функциональность открыть/закрыть все, нужно сделать экземпляр макроса,
 *  куда добавить одну виртуальную кнопу и все шторы.
 * Нажимая на неё через приложение, все шторы будут получать команды.
 *
 * * 2. Открыть по геркону
 *  Позволяет начать открывать шторы при отрывании двери, окна, и других открывающихся конструкций.
 *
 *  Может работать совместно с датчиком освещенности, и при превышении
 *    указанной освещенности начинать открывать штору в момент срабатывания геркона.
 *
 *  Например в случае открывания двери в котельную, в которой весит штора, открываем дверь, и ждем пока откроется штора.
 *  Например утром (освещение выше уставки) при выходе из спальни начинают открываться прихожая и гостиная.
 *
 * * 3. Открыть/Закрыть по освещенности
 *  Позволяет указать пороги освещенности после которых нужно изменить состояние шторы.
 *
 *  Порог задается кортежем [CLOSE, OPEN], можно задать несколько пороговых значений [[25, 150], [3000, 300]].
 *
 *  Если значение CLOSE < OPEN, то при освещении меньше (<) CLOSE штора будет закрываться,
 *   а при значении больше (>) OPEN будет открываться.
 *
 *  Если значение CLOSE > OPEN, то при освещении больше (>) CLOSE штора будет закрываться,
 *   а при значении меньше (<) OPEN будет открываться.
 *
 *  Нужно понимать, то, что когда штора закрыта, сила солнечного освещения сильно меньше, и нужно при пусконаладке
 *    определить какое освещение при закрытой шторе будет подходящим для изменения состояния.
 *  Пуска наладку сложно сделать непосредственно в день окончания монтажа, по этому пользователю будет выдана инструкция
 *    о том как регулировать значения освещенности.
 *
 *  Например:
 *    - Потемнело и в связи с этим стоит закрыть шторы, чтобы с улицы не было видно происходящего внутри
 *       [ при 25 закрыть, при 150 открыть], а как только солнце взойдет и освещение при закрытой шторе
 *       станет выше уставки, можно пытаться открыть штору.
 *    - Солнце взошло или тучи рассеялись после сумерек, стоит открыть шторы для инсоляции помещения
 *       [ закрыть при 100 при открытой шторе, открыть при 150 при закрытой шторе].
 *    - Солнце слишком яркое и/или светит на монитор, стоит закрыть окно, и как только освещение упадет
 *       до нужного порога открыть штору [закрыть при 3000 при открытой шторе, открыть при 300 при закрытой шторе ].
 *
 * * 4. Открывание/Закрывание по датчику движения и/или шуму.
 *  Дополняет изменение состояние шторы по освещенности,
 *   позволяет не открывать шторы, пока не появится движение и/или шум, даже когда освещение достаточно для открывания.
 *
 *  Позволяет при достаточном освещении открыть шторы в нужных места при появлении движения
 *   либо шума на указанных датчиках, свыше указанных значений.
 *
 * * 5. Открыть/Закрыть по времени
 *  Второй по приоритетности переключатель состояния после ручного нажатия на кнопку.
 *
 *  Позволяет указать в какой час нужно изменить состояние шторы.
 *  Можно задать по действию на каждый час.
 *
 *  {
 *    direction: "OPEN",
 *    blockMin: 2 * 60,
 *    mins: [1 * 60,4 * 60,6 * 60,8 * 60]
 *  }
 *  Штора будет пытаться открыться в час ночи, в 4, 6, 8
 *  утра причем после каждой попытки будут блокироваться
 *  автоматические действия на заданное время.
 *
 *  {
 *   direction: "CLOSE",
 *   blockMin: 8 * 60,
 *   mins: [18 * 60,20 * 60,0 * 60]
 *  }
 *  Штора будет пытаться закрыться в 18, 20, 0, часов
 *  причем после каждой попытки будут блокироваться автоматические
 *  действия на заданное время.
 *
 *  В случае если штора и так находится в состоянии OPEN или CLOSE ничего не произойдет.
 *  При пересечении времени, приоритет будет отдан операции CLOSE.
 *
 * * 6. Блокировка действий по времени
 *  Позволяет заблокировать изменение состояния шторы в заданном временном диапазоне.
 *
 *  Возможно указать какое именно действие блокировать, [[OPEN, 23, 9], [CLOSE, 11,16], [ANY, 21-22]].
 *
 *  Это полезно когда нужно приостановить выполнение автоматических функций.
 *
 *  В случае когда мы не хотим открывать штору с ночи до определенно времени дня например гарантированно до
 *    10 дня, мы зададим [[OPEN, 0, 10]].
 *  В случае когда мы гарантированно не хотим закрывать шторы в середине дня, мы зададим [[CLOSE, 11,16]].
 *  В случае когда мы хотим запретить все автоматические действия, скажем перед сном [[ANY, 20,23]].
 *
 *  В результате мы получим настройку [[OPEN, 0, 10], [CLOSE, 10,16], [ALL, 20,23]].
 *
 * Нужно понимать, что это специализированная настройка и за частую управление шторами
 *  будет происходит по освещенности + движение и шум.
 *
 * * 7. Открыть/Закрыть по освещенности движению, шуму и температуре
 *  В солнечные дни в комнату может проникать слишком много тепла от солнца и эта автоматизация
 *   даст возможность прикрыть штору, если в помещении выросла температура при высокой освещенности.
 *
 *  Позволяет закрыть штору если освещенность выше установленного порога, установилась
 *    полная тишина ни движения ни шума дольше заданного промежутка скажем 1 час, температура выше заданной уставки.
 *
 *  Позволяет закрыть штору не полностью, а прикрыть на нужную величину.
 *
 *  Открывание шторы произойдет по правилам "4. Открывание/Закрывание по датчику движения и/или шуму.".
 */
export type CoverMacrosSettings = {
  /**
   * Включает в себя все типы переключателей, кнопки,
   *  виртуальные кнопки, герконы.
   */
  readonly switchers: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SWITCH;
    /**
     * Значение по умолчанию DOWN
     */
    readonly trigger: Trigger;
  }>;
  readonly illuminations: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.ILLUMINATION;
  }>;
  readonly motions: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
  }>;
  readonly noises: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.SOUND_LEVEL;
  }>;
  readonly temperatures: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.TEMPERATURE;
  };
  /**
   * Контрол переключения состояния шторы.
   */
  readonly state: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.ENUM;
    /**
     * Выбирается пользователем из enum который предоставляет устройство.
     */
    readonly open: string;
    /**
     * Выбирается пользователем из enum который предоставляет устройство.
     */
    readonly close: string;
    /**
     * Выбирается пользователем из enum который предоставляет устройство.
     */
    readonly stop: string;
  };
  /**
   * Контрол позволяет увидеть положение шторы после окончания
   * движения, и задать то положение в которое должна прийти штора.
   */
  readonly position: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
    /**
     * Значение при полностью открытом положении
     */
    readonly open: number;
    /**
     * Значение при полностью закрытом положении
     */
    readonly close: number;
  };

  readonly illumination: {
    readonly detection: LevelDetection;

    /**
     * Диапазоны освещенности для закрывания и открывания шторы.
     *
     * Порог задается кортежем [CLOSE, OPEN], можно задать несколько
     * пороговых значений [[25, 150], [3000, 200], [300, 500]].
     *
     * Если значение CLOSE < OPEN, то при освещении меньше (<) CLOSE
     * штора будет закрываться, а при значении больше (>) OPEN будет
     * открываться.
     *
     * Если значение CLOSE > OPEN, то при освещении больше (>) CLOSE
     * штора будет закрываться, а при значении меньше (<) OPEN
     * будет открываться.
     *
     * Приоритет отдается закрытию.
     */
    readonly switchingBoundaries: [number, number][];
  };

  readonly motion: {
    readonly detection: LevelDetection;

    /**
     * Задает чувствительность к движению.
     */
    readonly trigger: number;
  };

  readonly noise: {
    readonly detection: LevelDetection;

    /**
     * Задает чувствительность к шуму.
     */
    readonly trigger: number;
  };

  readonly temperature: {
    readonly detection: LevelDetection;
  };

  /**
   * Определение полной тишины.
   *
   * Если > 0, то в случае отсутствия шума и движения группа
   * будет активен фактор закрытия по движению и шуму.
   *
   * Если указать <= 0, то фактор закрывания по шуму и движению
   * отключается.
   */
  readonly silenceMin: number;

  /**
   * Автоматическое открытие/закрытие шторы, по заданному часу в
   * сутках.
   */
  readonly openCloseByTime: {
    direction: CloseByTimeDirection;
    blockMin: number;
    mins: number[];
  };

  /**
   * Автоматическое закрытие шторы, по высокой солнечной
   * активности.
   */
  readonly closeBySun: {
    illumination: number;
    temperature: number;
    position: number;
  };

  /**
   * Блокировка автоматических действий.
   */
  readonly block: [BlockType, number, number][];
};

/**
 * ! STATE
 */
export type CoverMacrosPublicState = {
  /**
   * Текущее состояние
   *
   * CoverMacrosSettings.state.open - крышка открывается
   * CoverMacrosSettings.state.close - крышка закрывается
   * CoverMacrosSettings.state.stop - крышка остановлена
   *
   * enum может быть разным для разных устройств, и сопоставление
   * enum устройства и настроек макроса происходит пользователем.
   */
  state: string;

  /**
   * Положение шторы, от 0 до 100.
   *
   * По умолчанию 100 - открыто, 0 - закрыто.
   *
   * Реверс настраивается на самом устройстве, а так же можно
   * выполнить реверс через настройки, путем указания параметров
   * CoverMacrosSettings.position.open и
   * CoverMacrosSettings.position.close
   *
   * Возможно для каждой шторы задать значение открытого и
   * закрытого положения, исходя из этого макросу будет понятно, в
   * каком направлении двигать штору.
   *
   * Нужно иметь в виду, что при подключении привода, ему нужно
   * указать где начало и где границы открывания/закрывания, а так
   * же направление, и желательно задавать значение по умолчанию.
   */
  position: number;
};

type CoverMacrosPrivateState = {
  switch: Switch;
  illumination: number;
  motion: number;
  noise: number;
  temperature: number;
};

type CoverMacrosState = CoverMacrosPublicState & CoverMacrosPrivateState;

/**
 * ! OUTPUT
 */
/**
 * В результате макрос решает, каким способом по влиять на крышку
 * указать положение через position, либо задать state чтобы контроллер крышки
 * сделал всю работу, и полностью открыл, закрыл, остановил крышку.
 */
type CoverMacrosNextOutput = {
  position?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.VALUE;
    readonly value: number;
  };
  state?: {
    readonly deviceId: string;
    readonly controlId: string;
    readonly controlType: ControlType.ENUM;
    readonly value: string;
  };
};

const VERSION = 0;

type CoverMacrosParameters = MacrosParameters<string, string | undefined>;

export class CoverMacros extends Macros<MacrosType.COVER, CoverMacrosSettings, CoverMacrosState> {
  private nextOutput: CoverMacrosNextOutput;

  constructor(parameters: CoverMacrosParameters) {
    const settings = CoverMacros.parseSettings(parameters.settings, parameters.version);
    const state = CoverMacros.parseState(parameters.state);

    super({
      /**
       * Версия фиксируется в конструкторе конкретного макроса
       */
      version: VERSION,

      eventBus: parameters.eventBus,

      type: MacrosType.COVER,

      id: parameters.id,

      name: parameters.name,
      description: parameters.description,
      labels: parameters.labels,

      settings,

      state: defaultsDeep(state, {
        disable: {
          coldWater: false,
          hotWater: false,
          recirculation: false,
        },
        hotWaterTemperature: 60,
        coldWaterPumps: {},
        valves: {},
        boilerPumps: {},
        heatRequests: {},
        recirculationPumps: {},
      }),

      devices: parameters.devices,
      controls: parameters.controls,
    });

    this.nextOutput = {
      state: undefined,
      position: undefined,
    };
  }

  static parseSettings = (settings: string, version: number = VERSION): CoverMacrosSettings => {
    // if (version === VERSION) {
    //   logger('Settings in the current version ✅');
    //   logger(stringify({ from: version, to: VERSION }));

    // /**
    //  * TODO Проверять через JSON Schema
    //  */

    //   return JSON.parse(settings);
    // }

    // logger('Migrate settings was started 🚀');
    // logger(stringify({ from: version, to: VERSION }));

    // const mappers = [() => {}].slice(version, VERSION + 1);

    // logger(mappers);

    // const result = mappers.reduce((accumulator, mapper) => mapper(accumulator), JSON.parse(settings));

    // logger(stringify(result));
    // logger('Migrate settings was finished ✅');

    return JSON.parse(settings);
  };

  static parseState = (state?: string): CoverMacrosState => {
    if (!state) {
      return {
        position: 100,
        state: 'STOP',
        switch: Switch.OFF,
        illumination: -1,
        motion: -1,
        noise: -1,
        temperature: -1,
      };
    }

    /**
     * TODO Проверять через JSON Schema
     */

    return JSON.parse(state);
  };

  setState = (nextPublicState: string): void => {};

  protected applyPublicState = () => {
    return false;
  };

  protected applyInput = () => {
    return false;
  };

  protected applyExternalValue() {}

  protected computeOutput = (value: string) => {
    const nextOutput: CoverMacrosNextOutput = {
      state: undefined,
      position: undefined,
    };

    this.nextOutput = nextOutput;

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  };

  protected applyOutput = () => {};

  protected destroy() {}

  /**
   * ! INTERNAL_IMPLEMENTATION
   */
}