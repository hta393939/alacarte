var count = 0;
for (var i = 0; i < bone.Count; ++i) {
  IPXBone b = bone[i];
  if (b.Name == "") {
    continue;
  }
  if (b.IsAfterPhysics) {
    b.IsAfterPhysics = false; // 物理後変形
    count += 1;
  }
  // IKだけ1
  //b.Level = 0; // 変形階層を通常へ
}
// 剛体のボーン変形を無効化
for (var i = 0; i < body.Count; ++i) {
  IPXBody b = body[i];
  if (b.Name != "右胸" && b.Name != "左胸") {
    continue;
  }
  b.Mode = BodyMode.Static;
  //b.Bone = null;
}

for (var i = 0; i < vertex.Count; ++i) {
  IPXVertex v = vertex[i];
  //var x = v.Position.x;
  //var y = v.Position.y;
  //var z = v.Position.z;  
}

// UIへの反映は?
// PMX更新
connect.Pmx.Update(pmx);

// Form更新
connect.Form.UpdateList(UpdateObject.All);  // 重い場合は引数を変更して個別に更新

// View更新
connect.View.PMDView.UpdateModel();         // Viewの更新が不要な場合はコメントアウト
connect.View.PMDView.UpdateView();


MessageBox.Show("変更数:" + count, "script", MessageBoxButtons.OK, MessageBoxIcon.Information);
