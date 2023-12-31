# MISIS Banach Space ldt

Система видеодетекции объектов
нестационарной незаконной торговли

### [Скринкаст](https://youtu.be/DUPoDTjWpTI?si=p8rjGyDkCXnJIube)

## Введение

Наша задача состояла в разработке системы детекции объектов незаконной нестационарной торговли, интегрируемую с инфраструктурой городского видеонаблюдения. Она должна оперативно выявлять точки незаконной торговли на основе типа объекта (установленный или с возможностью
передвижения), его размера и местонахождения.
## Требования
1. Реализовать механизм определения точек нестационарной торговли по
видео трансляции с городских камер видеонаблюдения с использованием
нейронных сетей.

2. Реализовать веб интерфейс системы, который в режиме реального времени выводит на экран факты детектирования точек нелегальной торговли,
которые были обнаружены на предоставленных камерах видеонаблюдения
(стоп-кадр с выделением объекта интереса - красным прямоугольником)
или загруженных через интерфейс видеозаписях.
## Продукт
Наша платформа предлагает возможность как загружать и анализировать
видео, так и подключаться к камерам городского видеонаблюдения, просматривать видеопотоки в реальном времени. При обнаружении объекта на
сайте отображаются кадры с выделенным объектом, класс объекта, а так
же таймкод видео или реальное время обнаружения по камере, кроме того
система автоматически высылает уведомление на почту. Доступна возможность дополнительного обучения модели через пользовательский интерфейс
разметки(выделения объекта) на кадре видео. Так же предусмотрен интерактивный видеоплеер с ключевыми кадрами, и возможность выбрать один
из двух плееров для просмотра в режиме реального времени.

Платформа предоставляет возможность объединять камеры и видео по группам, основанным на различных критериях, таких как районы, в которых
расположены камеры, или структура отделов, которым они принадлежатб
для удобства отслеживания подключений.\
Реализована возможность авторизации, а так же разделение пользователей на администраторов и пользователей с ограниченным доступом. Администратор может создавать пользователей, группы, добавлять видео/камеры, распределять видео/камеры в группы и назначать права доступа для
пользователей. Таким образом, пользователи могут просматривать видео/камеры групп, в которых они состоят, без возможности добавлять/удалять
видео/камеры. Учитывая целевую аудиторию и конфиденциальность видеопотоков с камер городского видеонаблюдения, платформа является закрытой, предусматривает авторизацию только для пользователей, созданных,
администратором

## Запуск
1. git clone https://github.com/yogenyslav/ldt-2023
2. cd ldt
3. cd backend
4. sudo vim .env (есть пример в .env.example)
5. cd ../ml-backend
6. sudo vim .env (есть пример в .env.example)
7. cd ..
8. sudo make local
9. в зависимости от настроек на конкретной машине, может понадобиться
поменять права доступа к папке
9.1. если контейнер не собрался, то sudo chmod 777 -R . 


## Инструменты
**Frontend**
1. React, Typescript, React Router Dom
2. Material-UI, Emotion
3. Axios
4. Vite, ESLint

**Backend**
1. Golang - API сервис
2. Python FastAPI - сервис, который принимал запросы на обработку видео/стримов с помощью модели
4. PostgreSQL - база данных
5. RTSPtoHLS stream handler - open source образ сервера, который конвертирует поток с RTSP ссылок камер в HLS

**ML**
1. Roboflow, cvat - для разметки текста были выбраны как самые удобные
инструменты разметки снимков и подготвоки их для дальнейшего обучения
для нейронных сетей.
2. Ultralytics - библиотека для моделей детекции объектов YOLOv8 и RTDETR. На данный момент YOLOv8 является SOTA решением для задач
компьютерного зрения, а RT-DETR хорошо показал себя в ходе экспериментов для ансамблирования моделей.
3. OpenCV - библиотека для работы с изображениями.
Использованный датасет
Собранный и размеченный нами датасет
Условия и ограничения


## Преимущества продукта
### Ансамбль трех моделей
**Первичная детекция объектов**\
Первичная детекция объектов делается с помощью YOLOv8 Large.
Далее по предсказанным координатам вырезается часть изображения с
объектом с отступом по краям, регулирующимся в зависимости от размеров
объекта.
После этого с помощью RT-DETR Large идет подтверждение, какой
объект находится на картинке и, при подтверждении класса cart проводим
дополнительную проверку с помощью YOLOv8 Nano не является ли объект автомобилем, велосипедом, мотоциклом и др. для минимизации ложных
срабатываний.

**Детекция стационарных продавцов**\
При использовании режима Track модели YOLOv8 за каждым распознанным объектом закрепляется уникальный идентификационный номер. Для
каждого объекта класса Person (человек), обладающим уникальным ID,
собираем информацию - кадр первого и последнего появления (в случае
RTSP-трансляции это реальное Московское время), количество кадров, на
которых был распознан объект, координаты центров bounding box, путь к
исходному кадру. После сбора информации обо всех распознанных людях,
для каждого рассчитываются следующие показатели:
- Разница между максимальной достингутой координатой и минимальной по X и Y. В случае, если эти разницы не превышают опредлённое
число пикселей, зависящее от размеров исходного кадра, считаем объект
неподвижным. То есть наблюдаемый объект на протяжении большей части
видео либо долгий промежуток времени на прямой трансляции оставался
примерно в одной области.
- Стабильность Bounding Box. Определяется как (Количество кадров, на
которых был определён объект) / (Номер последнего кадра - Номер первого
кадра). Означает насколько хорошо и без перебоев распознавался объект.
- Время пребывания объекта. При обработке загруженного видео вычисляется как (Количество кадров, на которых был определён объект) /
(Общее количество кадров на видео). В случае прямой трансляции был
выбран определенный порог кол-ва кадров, и, если он превышен, считаем
объект долго находящимся в кадре.
В случае удовлетворения трех критериев определённым порогам, считаем человека стационарным продавцом.

**Детекция нестационарных продавцов**\
Было испробовано много подходов с использованием координат - счёт пересечений bounding box’ов людей с разными ID, счёт количества самопересечений траектории движения, анализ распределения точек на плоскости
XOY.

**Выводы по детекции**\
В итоге выбран следующий подход: используя метод кластеризации DBSCAN
с epsilon, заисящим от размера исходного кадра, получаем кластеры для точек, отображающиеся на графике как плотные скопления точек и интерпетируемые как места остановки движущегося человека. С нашей точки зрения теоретическая траектория движения человека, который может что-то
продавать или предлагать услуги прохожим, выглядит так: места остановки (как раз таки плотные скопления точек) на каких-то расстояниях друг
от друга. Если количество остановок превышает определенный порог, то
считаем человека нестационарным продавцом.

### Датасет, повторяющий реальные условия

Датасет для обучения включает в себя фотографии из открытого доступа хорошего и плохого качества, разного ракурса и освещения, погодных
условий. Кроме обычных фотографий были добавлены скриншоты из новостей и любительских видео - таким образом, объекты были запечатлены
в движении и real time, и такие скриншоты более приближены к данным, с
которыми придётся работать модели в production. Также были собраны и
добавлены скриншоты из Google и Яндекс Панорам, что наиболее приближено к кадрам с камерам наблюдения.

### Продвинутый веб-сервис
a) Веб-сервис обрабатывает все запросы пользователей параллельно (в том
числе загруженные видео и потоки с камер), следовательно, повышая быстродействие

b) Части веб-сервиса не зависят друг от друга, поэтому при необходимости
могут быть изменены (загрузить новые веса модели, поменять интерфейс,
др.)

c) Минимизация риска утечки данных: доступ к ресурсам могут иметь только сотрудники, для которых администратор создал учетные записи. Данные
для авторизации хранятся в зашифрованном виде

b) Автоматическое оповещение пользователя по электронной почте при обнаружении объекта незаконной торговли

## Гипотезы и дальнейшее развитие
1. Одним из популярных видов услуг является фотография с животным
(напр. голубь, обезьянка, попугай и т.д.). Сначала в нашем датасете был и
класс животные, но, как оказалось, для приближения к корректной детекции нужно собрать достаточно большой датасет с разнообразными видами
животных. Также выяснили, что с ракурса и качества камеры практически
все животные мелкие и почти не заметны. Поэтому обучить модель распознавать такие объекты безошибочно - очень ёмкая задача.

2. Использование всех собранных данных для опеределения активных продавцов. Возможно совмещение анализа траектории (остановок) и подсчёт
пересечений bounding box’ов для более точной детекции.
