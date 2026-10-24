
colmap --help

ROOTDIR=/gs/_proj1
NAME=_proj2

IMAGES=$ROOTDIR/$NAME/images
SPARSE=$ROOTDIR/$NAME/sparse
DATABASE=${ROOTDIR}/${NAME}db/database.db


if false; then
WORKSPACE=baz
colmap automatic_reconstructor \
  --image_path $IMAGES \
  --workspace_path $WORKSPACE
fi

if true; then
colmap feature_extractor \
  --image_path $IMAGES \
  --database_path $DATABASE \
  --FeatureExtraction.use_gpu 0

colmap exhaustive_matcher \
  --database_path $DATABASE \
  --FeatureMatching.use_gpu 0

mkdir -p $SPARSE
colmap mapper \
  --database_path $DATABASE \
  --image_path $IMAGES \
  --output_path $SPARSE

fi

