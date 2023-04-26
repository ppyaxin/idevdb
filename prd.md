# 产品设计

## 界面

### 选择器

* 表格，显示数据内容，最大一千行
* 表头，罗列所有字段，显示是否排序/过滤
* 字段选择器，位于表格左侧，选中表格需要显示的字段，包含排序/搜索/过滤条件
  * 搜索就是过滤当中的模糊搜索
* 可以保存当前查询
* 面包屑，保留当前的操作路径，可以返回上一路径

### 详情页

在选择器中单击选中对象后，显示该对象的详细信息和一些基本操作

### 主页面

显示所有根界面，例如数据源/任务

## 功能

* 创建数据源连接对象，所有连接对象默认root分组
* 查询数据源，根据名称/引擎/主机/多维分组等索引/排序，单击选中显示详情/统计
* 双击选中数据源，查询DB，根据名称，
* 添加DB到分组
* 双击选中DB，查询DB级对象：表，视图，函数等
* 双击选中表，查询表级对象：字段，索引等
* 发起任务，查看任务进度，子任务，任务结果
  * 每次查询也是查询任务，可以在大任务列表中查到
  * 保存任务，比如保存当前查询
  * 任务迁移，如同一查询迁移到其他DB/数据源中

## 对象

* 数据源连接
* 临时对象，用户查询后生成（数据库连接->DB->表->字段）
* 分组，可包含数据源、DB、表等对象
* 任务，通过用户直接操作或描述文件生成，包含其他对象和任务执行依赖，可视作可执行的分组
* 描述文件，yaml格式

数据源

* connector
  * mysql connector
  * sqlite connector
* connection
* database
* table
* view
* field
* index

任务

* query
  * sql query
  * option query
* insert
  * sql insert
  * data insert
* alter
  * sql alter
  * fields alter
* transfer
* transfrom
* perf
* stat
* compare

## 任务

* 传输任务
* 查询任务，可以视作将数据从源传输到本地，包括元数据查询
* 修改任务，可以视作将本地数据传输到目标数据源

## 数据设计

* oid
* name
* type: connection, db, table... | query, transfer, alter | group, task
* engine: mysql, idevdb
* status: 0->未开始，1->进行中

外表

* groups: 新建一张表，保存对象到分组的多对多
  * 每个分组的成员都只有一层深度，多层深度的就是嵌套分组
  * 可以包含子任务，在字段中保存进度
* fields: 新建一张表，保存对象到字段的多对多
  * task_oid: 所属的根任务oid
  * parent_oid
  * dep_oid: 在同一任务中，该执行步骤的前置依赖步骤
  * con_oid: 在一个任务/步骤中指定的连接
  * sql: 在查询任务中执行的sql

嵌套任务

* task
  * transfer
    * piece

## 接口设计

* 提交查询任务json/xml/yaml
* 在store中生成需要的对象和oid
* 从当前启动的task中生成子task用于执行查询任务
* 从store中读取该查询任务的元数据
* 打开查询连接，开始查询
* 所有
