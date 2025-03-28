Request.RespContentType = 'application/json';
var _log_tag = "create_poll_result"
EnableLog(_log_tag)



// =========================   UTILS   ==============================
function Log(message)
{
    LogEvent(_log_tag, message)
}

function SendResponse(success, data, message)
{
    if (message == undefined)
    {
        message = "";
    }

    Response.Write(tools.object_to_text(
        {
            success: success,
            message: message,
            data: data
        },
        "json"
    ));
    
    return;
}

function ParseQuery()
{
    var _params = 
        {
            action: Request.Query.GetOptProperty("action", "open_poll"),
            poll_id: Request.Query.GetOptProperty("poll_id", null),
            answers: Request.Query.GetOptProperty("answers", null)
        }
    


    /*
        Ожидается, что поле answers будет представлено в виде JSON строки с массивом объектов:
        {
            id: ID вопроса,
            value: Текст ответа или ID варианта ответа,
            comment: Текст ответа в комментарии
        }
    */
    try
    {
        _params.answers = ParseJson(_params.answers);
    }
    catch (e)
    {
        Log("Не удалось распарсить ответы из JSON: " + tools.object_to_text(_params.answers, "json") + " | " + String(e));
        _params.answers = null;
    }
    
    return _params;
}
// ==================================================================



// =======================   FUNCTIONS   ============================
// Поиск начатого пользователем опроса, возвращает id найденного poll_result
function FindPollResult(_col_id, _poll_id)
{
    var _sql =
        "SELECT \
            id \
        FROM dbo.poll_results \
        WHERE \
            poll_id = " + _poll_id + " \
            AND person_id = " + _col_id + " \
        ORDER BY create_date DESC LIMIT 1";

    var _pr = ArrayOptFirstElem(XQuery("sql: " + _sql), null);
    
    try
    {
        return Int(_pr.id);
    }
    catch (e)
    {
        return null;
    }
}

// Создает новый poll_reult, возвращает id созданного poll_result
function CreatePollResult(_col_id, _poll_id)
{   
    _coll_te = OpenDoc(UrlFromDocID(Int(_col_id))).TopElem;

    _poll_result = OpenNewDoc("x-local://wtv/wtv_poll_result.xmd");
    _poll_result_te = _poll_result.TopElem;
    _poll_result_te.poll_id = _poll_id;
    _poll_result_te.person_id = _col_id;
    _poll_result_te.person_code = _coll_te.code.Value;
    _poll_result_te.person_position_id = _coll_te.position_id.Value;
    _poll_result_te.is_done = false;
    _poll_result_te.status = 1;
    _poll_result.BindToDb();
    _poll_result.Save();
    return _poll_result.TopElem.id;
}

// Возвращает id созданного или найденного poll_result
function GetPollResult(_col_id, _poll_id)
{
    var _pr_id;
    try {
        _pr_id = FindPollResult(curUser.id.Value, _q.poll_id);
        var _pr_te = OpenDoc(UrlFromDocID(Int(_pr_id))).TopElem;
        if (_pr_te.status > 1)
        {
            throw "poll_finished";
        }
    }
    catch(e)
    {
        _pr_id = CreatePollResult(curUser.id.Value, _q.poll_id);
    }
    return Int(_pr_id);
}

// Заполняет ответы сотрудника в TopElem poll_result
function FillPollResultAnswers(_poll_result_te, _answers)
{
    if (!IsArray(_answers))
    {
        Log("Ответы не являются массивом");
        return;
    }

    for (_a in _answers)
    {
        _q = _poll_result_te.questions.ObtainChildByKey(_a.id, 'id');
        _q.value = _a.value;
        try
        {
            _q.comment = _a.comment;
        }
        catch(e)
        {
            _q.comment = null;
        }
    }
}

// Возвращает список вопросов из переданного TopElem опроса
function GetPollQuestions(_pollTe)
{
    if (!ArrayCount(_pollTe.questions))
    {
        return [];
    }
    var _questions = [];
    var is_questions_block;

    for (_q in _pollTe.questions)
    {
        /*
            Собираем варианты ответа на вопрос.
            Если вариант ответа - "Затрудняюсь ответить", устанавливаем флаг обязательного ввода комментария
        */
        _answers = [];
        for (_a in _q.entries)
        {
            _answers.push(
                {
                    id: _a.id.Value,
                    value: _a.value.Value,
                    comment_required: OptInt(_a.weight, null) == 3,
                    weight: OptInt(_a.weight, 0)
                }
            );
        }

        is_questions_block = (_q.type.Value == "choice") && (ArrayCount(_q.entries) == 0);

        _questions.push(
            {
                id: _q.id.Value,
                type: (is_questions_block ? "block" : _q.type.Value),
                title: _q.title.Value,
                answers: _answers,
                
            }
        );
    }

    return _questions;
}

// Возвращает объект - информацию об опросе
function GetPollData(_poll_id)
{
    try
    {
        var _poll_te = OpenDoc(UrlFromDocID(Int(_poll_id))).TopElem;
    }
    catch(e)
    {
        return null;
    }

    var _questions = GetPollQuestions(_poll_te);

    var _data =
        {
            id: _poll_te.id.Value,
            name: _poll_te.name.Value,
            code: _poll_te.code.Value,
            description: _poll_te.desc.Value,
            completed: _poll_te.completed.Value,
            questions: _questions
        }
    
    return _data;
}
// ==================================================================



// ========================   HANDLERS   ============================
// Хэндлер открытия опроса.
// Создает poll_result, если нет активного и возвращает сведения об опросе.
function Handler_OpenPoll(_q)
{
    if (_q.poll_id == null)
    {
        throw "missed_poll_id";
    }

    try
    {
        OpenDoc(UrlFromDocID(Int(_q.poll_id))).TopElem;
    }
    catch(e)
    {
        throw "wrong_poll_id";
    }

    // Создаем новый poll_result, если нет начатого прохождения опроса
    // GetPollResult(curUser.id.Value, _q.poll_id);


    SendResponse(true, GetPollData(_q.poll_id));
}

// Хэндлер завершения опроса.
// Создает poll_result, если нет активного.
// Сохраняет ответы сотрудника.
function Handler_FinishPoll(_q)
{
    if (_q.poll_id == null)
    {
        throw "missed_poll_id";
    }

    try
    {
        OpenDoc(UrlFromDocID(Int(_q.poll_id))).TopElem;
    }
    catch(e)
    {
        throw "wrong_poll_id";
    }

    // Создаем новый poll_result, если нет начатого прохождения опроса
    // Получаем ID существующего или созданного poll_result
    var _pr_id = GetPollResult(curUser.id.Value, _q.poll_id);

    var _pr = OpenDoc(UrlFromDocID(Int(_pr_id)));
    var _pr_te = _pr.TopElem;

    _pr_te.is_done = true;
    _pr_te.status = 2;
    FillPollResultAnswers(_pr_te, _q.answers);

    _pr.Save();

    SendResponse(true, {poll_result_id: _pr_id}, "Опрос успешно завершен");
}
// ==================================================================



// ==========================   MAIN   ==============================
try
{   
    var _HANDLERS = {
        "open_poll": Handler_OpenPoll,
        "finish_poll": Handler_FinishPoll
    };

    var _query = ParseQuery();

    try
    {
        var h = _HANDLERS[_query.action];
    }
    catch(e)
    {
        throw "unknown_action";
    }
    h(_query);
}
// ====================   Обработка ошибок   ========================
catch(err)
{
    Log(String(err));

    // Сообщения для отображения в ответе
    var _messages =
    {
        "unknown_action": "Метод не существует",
        "missed_poll_id": "Опрос не выбран",
        "wrong_poll_id": "Опрос не существует"
    };

    try
    {
        SendResponse(false, null, _messages[err.message]);
    }
    catch (e)
    {
        SendResponse(false, null, "Неизвестная ошибка: " + String(err));
    }
}