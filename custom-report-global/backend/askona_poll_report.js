Request.RespContentType = 'application/json';
Request.AddRespHeader("Access-Control-Allow-Origin", "*");
var _log_tag = "poll_report"
EnableLog(_log_tag)

function Log(message)
{
    LogEvent(_log_tag, message)
}

function SendResponse(success, message, data)
{
    Response.Write(tools.object_to_text(
        {
            success: success,
            message: message,
            data: data
        },
        "json"
    ))
}

function ParseQueryParams()
{
    return {
        poll_id: Request.Query.GetOptProperty("poll_id", null),
        coll_id: Request.Query.GetOptProperty("coll_id", null)
    }
}

function AddColumn(columns, text, key)
{
    columns.push(
        {
            value: text,
            key: key
        }
    )
}

function SetColumns(columns, questions)
{
    AddColumn(columns, "ФИО", "coll_fullname");
    AddColumn(columns, "Руководитель", "coll_manager");
    AddColumn(columns, "Должность", "coll_position");
    AddColumn(columns, "Подразделение", "coll_subdivision");
    AddColumn(columns, "Организация", "coll_org");
    AddColumn(columns, "Код", "coll_code");
    AddColumn(columns, "Опрос", "poll_name");
    AddColumn(columns, "Дата прохождения", "poll_date")

    for (_q in questions)
    {
        if (_q.is_block)
        {
            AddColumn(columns, _q.title, "block"+_q.id+"_avg");
            AddColumn(columns, _q.title, "block"+_q.id+"_res");
            continue;
        }

        AddColumn(columns, _q.title, "question" + _q.id);
    }
}

function SetRows(rows, poll_results, poll_info)
{
    for (_res in poll_results)
    {
        _res_te = OpenDoc(UrlFromDocID(Int(_res.id))).TopElem;

        _person = ArrayOptFirstElem(XQuery("for $c in collaborators where id=" + _res_te.person_id.Value + " return $c"), null);

        if (_person == null)
        {
            continue;
        }

        _person_managers = tools.get_uni_user_bosses(Int(_person.id), {return_object_type: 'collaborator',  return_object_value: null})

        _row =
            {
                coll_fullname: _person.fullname.Value,
                coll_position: _person.position_name.Value,
                coll_subdivision: _person.position_parent_name.Value,
                coll_code: _person.code.Value,
                coll_manager: String(ArrayOptFirstElem(_person_managers, {fullname: "-"}).fullname),
                coll_org: _person.org_name.Value,
                poll_name: poll_info.name,
                poll_date: StrDate(_res.create_date.Value)
            };
        
        // Для анкеты по ценностям, где вопросы распределены на блоки
        _current_block = null;


        // Цикл по вопросам в карточке опроса
        for (_q in poll_info.questions)
        {
            // Ответ на вопрос в карточке результата
            _question_answer = ArrayOptFirstElem(ArraySelectByKey(_res_te.questions, _q.id, "id"), null);
            
            
            // Будет записано в отчет
            _answer_text = "-"

            if (_q.is_block)
            {
                // Вопрос является началом нового блока
                if (_current_block != null)
                {
                    _avg = 0;
                    if (_current_block.count > 0)
                    {
                        _avg = Math.round((_current_block.points / _current_block.count) * 100);
                    }
                    _row["block"+_current_block.id+"_avg"] = _avg;
                    _row["block"+_current_block.id+"_res"] = 'A'; 
                }

                _current_block = {
                    id: _q.id,
                    count: 0,
                    points: 0
                }

                continue;
            }


            // Если есть ответ пользователя на текущий вопрос
            if (_question_answer != null)
            {
                switch (_q.type)
                {
                    case "choice":
                        // Получаем выбранный вариант ответа
                        _answer_option = ArrayOptFirstElem(ArraySelectByKey(_q.answers, Int(_question_answer.value.Value), "id"), null)

                        if (_answer_option != null)
                        {
                            _answer_text = _answer_option.value + (_q.commentable && _question_answer.ChildExists('comment') && (_question_answer.comment.Value != "") ? " (" + _question_answer.comment.Value + ")" : "");

                            // Если вопрос в блоке
                            if (_current_block != null)
                            {
                                _current_block.count += 1;
                                _current_block.points += _answer_option.weight;
                            }                            
                        }
                        
                        break;

                    case "text":
                        _answer_text = _question_answer.value.Value;
                        break;
                }           
            }
            
            _row["question"+_q.id] = _answer_text;
        }

        if (_current_block != null)
        {
            _avg = 0;
            if (_current_block.count > 0)
            {
                _avg = Real(Math.round((_current_block.points / _current_block.count) * 100)) / 100;
            }
            _row["block"+_current_block.id+"_avg"] = _avg;
            _row["block"+_current_block.id+"_res"] = 'A'; 
        }

        rows.push(_row);
    }
}

function GetPollResults(poll_id, coll_id)
{   
    var _sql =
        "SELECT \
            * \
        FROM dbo.poll_results \
        WHERE 1=1";

    if (poll_id != null)
    {
        _sql += " \
            AND poll_id=" + poll_id;
    }

    
    if (coll_id != null)
    {
        _sql += " \
            AND person_id=" + coll_id;
    }

    return ArrayDirect(XQuery("sql: " + _sql));
}

function ParseQuestionAnswers (question)
{
    _answers = [];
    if (!question.ChildExists("entries")) return _answers;

    for (_a in question.entries)
    {
        _answers.push(
            {
                id: _a.id.Value,
                value: _a.value.Value,
                weight: (_a.ChildExists("weight") && (_a.weight.Value != null) ? _a.weight.Value : 0)
            }
        );
    }

    return _answers;
}

function GetPollInfo(poll_id)
{
    var _poll_te = OpenDoc(UrlFromDocID(Int(poll_id))).TopElem;

    var _questions = [];



    for (_q in _poll_te.questions)
    {     
        _is_block = (_q.type.Value == "choice") && (ArrayCount(_q.entries) == 0)


        _questions.push({
            id: _q.id.Value,
            type: _q.type.Value,
            title: _q.title.Value,
            answers: ParseQuestionAnswers(_q),
            commentable: _q.add_comment.Value,
            is_block: _is_block
        });
    }
    
    return {
        name: _poll_te.name.Value,
        questions: _questions
    }
}

try
{
    var _params = ParseQueryParams();

    try
    {
        var _poll_info = GetPollInfo(_params.poll_id);
    }
    catch (e)
    {
        throw "poll_not_found";
    }
    
    var _poll_res = GetPollResults(_params.poll_id, _params.coll_id);

    var _report_columns = [];
    var _report_rows = [];

    SetColumns(_report_columns, _poll_info.questions);
    SetRows(_report_rows, _poll_res, _poll_info);

    SendResponse(
        true,
        "Отчет успешно сформирован",
        {
            columns: _report_columns,
            rows: _report_rows
        }
    )
}
catch (err)
{
    Log(String(err));
    SendResponse(false, err.message, {err: String(err)});
}