# Devices page

## Введение

Все взаимодействие с устройствами подключенными к контроллеру происходит в рамках протокола [MQTT](https://wirenboard.com/wiki/index.php/MQTT).

MQTT позволяет:

- Получить мета информацию о устройствах.
- Получить мета информацию о контролах.
- Получить текущее состояние контролов.
- Изменить состояние контрола.

Hyperion прослушивать все MQTT сообщения, и формирует из них объект [HyperionDevice](../src/domain/hyperion-device.ts) на уровне приложения.

Эти объекты используются для:

- Хранения текущего состояния устройства в БД.
- Ведения истории изменений состояний контролов.
- Удобного представления устройства на уровне приложения.
- Передачи данных на FE при помощи слоя [GraphQL](../src/interfaces/http/graphql/schema.graphql#L142), и типа `Device`.
- Создания макросов.

FE коммуницирует только с [GraphQL](../src/interfaces/http/graphql/schema.graphql#L229), и не знает каким образом происходит преобразование из MQTT сообщений в [HyperionDevice](../src/domain/hyperion-device.ts), и обратно.

Актуальные данные FE получается из подписки [GraphQL Subscription](../src/interfaces/http/graphql/schema.graphql#L260).

На странице устройств мы видим навигацию, фильтр по устройствам, список устройств в виде grid системы, и пагинацию по страницам, если это нужно.

Все данные на этой странице подтягиваются в реальном времени, через `GraphQL subscription`, по верх `web socket` соединения.

## Функциональное назначение

В рамках понятий проекта, устройства и контролы wirenboard это некие абстрактные вещи. Например устройство `wb-msw-v3_123`, контрол `Air Quality (VOC)`, или устройство `0x00158d00096964ea`, контрол `temperature` и так далее.

Но в рамках понятия проекта "умного" дома мы оперируем понятиями `качество воздуха в спальне`, `температура поверхности пола в кабинете`.

Для того, чтобы связать абстрактные идентификаторы устройств и контролов с понятиями из проекта "умного" дома, необходимо в объекты [HyperionDevice](../src/domain/hyperion-device.ts), добавить информацию в `markup` и `labels` о том, что это устройство и его контрол(ы) означают, в рамках проекта "умного" дома.

Но если мы будем `хардкодить` эти связи для каждой инсталляции мы получим `легаси` решение сразу же после того как оно будет запущено. Так как для изменения какого либо параметра придется прибегать к услугам программиста.

Для решения этой задачи, нам требуется GUI который позволит размечать устройства без вмешательство в код.

После того как все устройства и их контролы размечены появляется возможность конфигурировать [макросы](./macros-page.md).

## Навигация

См. [navigation](./navigation.md).

## Фильтр

См. [filter](./filter.md).

## Устройства

Представляет из себя карточки `устройств`, каждая такая карточка представляет объект [HyperionDevice](../src/domain/hyperion-device.ts).

**На лицевой части карточки выводится информация из полей:**

- `title` & `markup.title` (в зависимости от выбранного языка), если значения `markup.title` установлены то выводятся в формате `${markup.title} (${title})` иначе просто `title`. Если `title` не определен то выводится комбинация `id + driver`, как выводить указано в следующем пункте.
- `${id} (${driver})`, если поля `driver` нет или оно `UNSPECIFIED` или совпадает с `id`, то выводим просто `id`.
- `markup.description`.
- Количество контролов внутри.
- `labels` (выводятся как теги, на которые можно дважды кликнуть, и установится фильтр по лейблу, в следствии чего страница будет отфильтрована).
- `markup.color` (меняет цвет фона карточки, либо каким то образом отмечает карточку цветом).
- `error` (есть ошибка или нет).
  - Возле ошибки дать кнопку скачать данные ошибки.
- `meta`, показать если в этом поле что-то есть
  - Возле информации о наличии мета информации сделать кнопку которая позволит скачать всю `meta` информацию.
- Кнопка открыть это устройство.

Устройство открывается как оверлей над списком устройств.

На странице устройства, выводится вся та же информация, что и на карточке устройства, в заголовке устройства.

**Ниже этого, дается возможно редактировать поля устройства:**

- `markup.title`
- `markup.description`
- `markup.order`
- `markup.color`
- `labels`

После этого, выводится список контролов.

**В каждом контроле выводится:**

- `id`, если указан `markup.title`, то `${markup.title} (${id})`
- `type`, исходя из которого мы понимаем какой UI элемент использовать для быстрого изменения значения (input, switch, button, range, color).
- `value`, текущее значение + иконка для перехода на страницу просмотра исторических данных.
  - [Страница вывода исторических данных, это отдельная страница, которая позволяет просматривать данные по нескольким контролам, нескольких устройств](./history.md), при переходе на страницу, выставляется фильтр по этому контролу, за последние 3 суток.
- `readonly`, в случае если контрол только для чтения, то быстрое изменение параметра не доступно.
- `labels`, выводим список лейблов.
- `markup.order`, если определено, то нужно учитывать при сортировки.
- `markup.color`, если определено, то нужно отметить контрол таким цветом.
- `error`, если там, что-то есть то показываем, что есть ошибка и выводим её текст.
- `meta`, если там, что-то есть то показываем поле, и показываем, две кнопки, одна для просмотра, вторая для копирования.
- Кнопка для детального редактирования контрола.

**В детальном редактировании контрола мы должны мочь:**

- Менять `markup.title`
- Менять `markup.description`
- Менять `markup.order`
- Менять `markup.color`
- Менять `labels`
- Сохранить изменения, и вернуться к редактированию устройства.

## Пагинация

См. [pagination](./pagination.md).

## Сценарий использования

Страница устройств используется только в начале пусконаладочных работ, для того, чтобы разметить все устройства, и в дальнейшем, чтобы скорректировать разметку.

Так же страница будет использована для просмотра данных в реальном времени, а так же исторических данных для каждого контрола.