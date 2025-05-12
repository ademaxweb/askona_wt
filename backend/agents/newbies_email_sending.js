// ===========================   LOGS AND DEBUG   =======================================
var _log_tag = "newbies_email_sending";
var _debug = Param.GetOptProperty("is_debug", false);

EnableLog(_log_tag);

function Log(message)
{
    LogEvent(_log_tag, toString(message));
}

function Debug(message)
{
    if (!_debug) return;

    LogEvent(_log_tag, toString(message));
}
// ============================================================================



// =========================   FUNCTIONS   ====================================
function toString(v)
{
    if (DataType(v) == "object")
    {
        return tools.object_to_text(v, "json");
    }
    return String(v);
}


// Получение сотрудников и руководителя группы
function GetGroupsInfo(group_ids, manager_type_id)
{
    var _groups_info = []

    for (_group_id in group_ids)
    {
        try
        {
            _group = OpenDoc(UrlFromDocID(Int(_group_id)));
        }
        catch (e)
        {
            Debug("Не удалось открыть документ группы: " + _group_id);
        }

        _colls = ArrayExtract(
            _group.TopElem.collaborators,
            "Int(This.collaborator_id)"
        );

        _managers = ArrayExtract(
            _group.TopElem.func_managers,
            "({id: Int(This.person_id), type: OptInt(This.boss_type_id, 0)})"
        );

        _groups_info.push(
            {
                name: String(_group.TopElem.name),
                collaborators: _colls,
                manager: ArrayOptFindByKey(_managers, manager_type_id, "type")
            }
        );
    }

    return _groups_info;

}

// Получение новых сотрудников
function GetNewbies()
{
    var _sql =
        "SELECT \
            id, fullname \
        FROM dbo.collaborators \
        WHERE hire_date >= DATEADD(day, -10, GETDATE())";

    Debug(_sql);

    return ArraySelectAll(XQuery("sql: " + _sql));
}

// Составление ссылки для нового сотрудника
function BuildCollaboratorLink(coll_info)
{
    var _base_url = "https://exam.askona.ru/_wt/change_coll_photo/collaborator_id/";

    return '<a href="' + _base_url + Int(coll_info.id) + '" target="blank">' + String(coll_info.fullname) + '</a>'
}
// ============================================================================



// ===========================   MAIN   =======================================
try
{
    var _group_ids = ArrayExtract(tools_web.parse_multiple_parameter(Param.GetOptProperty("groups", [])), "Int(This)");
    var _manager_type_id = Int(Param.GetOptProperty("manager_type", null));

    // Сведения о группах
    var _groups = GetGroupsInfo(_group_ids, _manager_type_id);

    Debug(_groups);
    
    // Новые сотрудники
    var _newbies = GetNewbies();
    Log("Найдено новых сотрудников: " + ArrayCount(_newbies))

    for (_group in _groups)
    {
        // Новые сотрудники в группе
        _group_newbies = ArraySelect(_newbies, "_group.collaborators.indexOf(Int(This.id)) > -1");

        if (!ArrayCount(_group_newbies)) continue;

        // Ссылки по каждой группе
        _group_links = ArrayExtract(_group_newbies, "BuildCollaboratorLink(This)");

        Debug("Ссылки для " + _group.name + ": " + toString(_group_links));

        // Итоговое сообщение
        _message = ArrayMerge(_group_links, "This", "<br>");
        
        Debug("Отправляется сообщение: " + _message + " для руководителя: " + OptInt(_group.manager.id, 0));
        _successfull_send = tools.create_notification("newbie_went_to_work", OptInt(_group.manager.id, 0), _message);
    }
    
}
// ============================================================================



// ===========================   ERRORS   =====================================
catch(err)
{
    Debug("Ошибка: " + String(err));
}
// ============================================================================