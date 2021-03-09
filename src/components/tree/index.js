import React,{useState ,useEffect,createRef} from 'react'
import { Checkbox  } from 'antd';
import styles from  './index.less';
class BigTree extends  React.Component {
  constructor(props) {
    super(props)
    let {treeData,onCheck,onSelect} = props;
    this.state = {
      treeHeight:0,
      virtualTreeList:[], //渲染的数据
      offset:0
    }
    this.rootRef = createRef();
    this.visibleList = [];
    this.treeData = treeData;
    this.visibleList.push(treeData[treeData.length-1]); //根节点数据默认要渲染
    this.onCheck = onCheck;
    this.onSelect = onSelect;
  }
  //
  recursiveChecked(id, status){
    this.visibleList.forEach(item => {
      if (item.pId === id) {
        if (item.hasChildren && item.expand) {
          this.recursiveChecked(item.id, status)
        }
        item.indeterminate = false;
        item.checked = status;
      }
    })
  }

  //点击展开时，将子节点为展开的也展开
  recursionExpand(it,treeData){
    let res =[]
    function findChild(item) {
      let childList = treeData.filter(v => v.pId == item.id);
      childList.map(v => {
        v.visible = true;
        v.checked = item.checked;
        res.push(v)
        if(v.hasChildren && v.expand){
          findChild(v)
        }
      })
    }
    findChild(it)
    return res

  }
  //如果有id，则表明数据还要进行scrollTo操作
  toggleExpanded(item,id) {
    //将所有可见的元素进行有序插入
    debugger
    let handExpand = !!id;
    item.expand = (handExpand)?true:!item.expand;
    let visibleList = this.visibleList;
    //找到点击的项目在渲染里面的索引
    let index = visibleList.findIndex(v => v.id == item.id);

    //找到该元素所有的子元素
    // let childList = this.treeData.filter(v => v.pId == item.id);
    //如果是展开;展开时，如果父级为checked，则将子级级也全部check;
    if(item.expand){
      let res =  this.recursionExpand(item,this.treeData)
      // childList.map(v => {v.visible = true;v.checked =item.checked});
      visibleList.splice(index+1,0,...res);
    }
    else{
      //收起时，将子节点的也收起
      this.recursionVisible(item.id, item.expand)
      this.visibleList = this.visibleList.filter(v => v.visible)

    }
    this.updateVirtualTree(id);
  }
  //回溯父节点，将节点变为半选或全选状态
  recursionParentChecked(parentId){
    let visibleList = this.visibleList;
    let idx = visibleList.findIndex(v => v.id == parentId);
    let allChild = this.visibleList.filter(v => v.pId == parentId);
    let allChildChecked = allChild.filter(v => v.checked);
    //如果子节点的数量大于0，且勾选的数量不等于下属子节点的数量
    if(allChild.length > allChildChecked.length && allChild.length){
      //当子元素check个数为0时， 状态变为false
      //大于0时，为真
      visibleList[idx]['indeterminate'] = !!allChildChecked.length;
      visibleList[idx].checked = false;

    }
    else{
      visibleList[idx].checked = true;
      visibleList[idx]['indeterminate'] = false;
    }
    //继续回溯父节点
    if(visibleList[idx].pId){
      this.recursionParentChecked(visibleList[idx].pId)
    }
  }
  chbChange(item){
    item.checked = !item.checked;
    let visibleList = this.visibleList;
    let index = visibleList.findIndex(v => v.id == item.id);
    //当前状态一定要移除
    visibleList[index]['indeterminate'] = false;

    //处理父节点的半选中状态;
    let parentId = visibleList[index].pId;
    //如果具有父节点
    if(parentId){
      //往上追溯父节点
      this.recursionParentChecked(parentId)
    }
    else{
      visibleList[index].checked = item.checked;

      // visibleList.checked = true;

    }
    //往下追溯子节点
    this.onCheck && this.onCheck(item);

    this.recursiveChecked(visibleList[index].id,item.checked)
    this.updateVirtualTree()

  }

  recursionVisible(id, status) {
    this.visibleList.forEach(item => {
      if (item.pId === id) {
        if (item.hasChildren && item.expand) {
          this.recursionVisible(item.id, status)
        }
        item.visible = status;
        item.expand = false;
      }
    })
  }

  updateVirtualTree(value) {
    const tree = this.visibleList;
    this.setState({treeHeight:tree.length*26},e => {
      let start = Math.floor(this.rootRef.current.scrollTop / 26)
      start = start < 0 ? 0 : start
      const end = start + Math.floor(this.rootRef.current.clientHeight / 26) + 10;
      this.setState({
        virtualTreeList:tree.slice(start, end),
        offset:start * 26
      },e => {
        if(value){
            let index = tree.findIndex(v => v.id ==value.id);
           this.rootRef.current.scrollTo(0,(index)*26)
        }
      })

    })
  }
  componentDidMount(){
    this.updateVirtualTree()
  }
  onItemClick(item){
    this.onSelect&&this.onSelect(item);
  }
  render(){
    let {treeHeight,virtualTreeList,offset} = this.state;
    return (
      <div className={styles["big-data-tree"]} ref={this.rootRef}  onScroll={e => this.updateVirtualTree()}>
        <div className={styles["real-tree-wrapper"]} style={{height:treeHeight}} ></div>
        <div className={styles["virtual-tree-wrapper"]} style={{transform:`translateY(${offset}px)`}}>
          {virtualTreeList.map( (v,idx) => {
            return (<div className={styles["tree-item"]} key={idx} style={{marginLeft:v.level*12}}>
              <div className={styles["node-expand"]} onClick={e => this.toggleExpanded(v)} style={{display:v.hasChildren?'block':'none',transform:v.expand?'rotate(90deg)':''}}> </div>
              <Checkbox  indeterminate={v.indeterminate} onChange={e => this.chbChange(v)} className={styles["node-checkbox"]} checked={v.checked} style={{marginLeft:v.hasChildren?'0':'12px'}}></Checkbox>
              <div className={styles["node-detail"]} onClick={e => this.onItemClick(v)}
              style={{cursor:v.key?'pointer':'default',color:v.searched?'#f1a645':'black'}}
              > {v.name}</div>
            </div>)

          })}
        </div>
      </div>

    )
  }
}

export default  BigTree

