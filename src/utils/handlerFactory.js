import catchAsync from './catchAsync.js';
import AppError from './appError.js';
import APIFeatures from './apiFeatures.js';

// DELETE ONE
export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError('No document found with that ID.', 404));
    res.status(204).json({ status: 'success', data: null });
  });

// UPDATE ONE
export const updateOne = (Model, docKey = 'data') =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError('No document found with that ID.', 404));
    res.status(200).json({ status: 'success', data: { [docKey]: doc } });
  });

// CREATE ONE
export const createOne = (Model, docKey = 'data') =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: { [docKey]: doc } });
  });

// GET ONE
export const getOne = (Model, popOptions, docKey = 'data') =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) return next(new AppError('No document found with that ID.', 404));
    res.status(200).json({ status: 'success', data: { [docKey]: doc } });
  });

// GET ALL
export const getAll = (Model, docKey = 'data', searchFields = []) =>
  catchAsync(async (req, res, next) => {
    const filter = req.filterQuery || {};

    let features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields();

    if (searchFields.length) features = features.search(searchFields);

    features.paginate();

    // Count with filters applied (no sort/limit/skip for accuracy)
    const countFeatures = new APIFeatures(
      Model.find(filter),
      req.query,
    ).filter();
    if (searchFields.length) countFeatures.search(searchFields);

    const [docs, total] = await Promise.all([
      features.query,
      countFeatures.query.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      results: docs.length,
      pagination: {
        total,
        page: features.page,
        limit: features.limit,
        totalPages: Math.ceil(total / features.limit),
      },
      data: { [docKey]: docs },
    });
  });
